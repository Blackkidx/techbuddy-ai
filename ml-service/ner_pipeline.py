# ml-service/ner_pipeline.py (Final Tweak to Aggregation/Filtering Logic)

import torch
import json
from transformers import AutoTokenizer, AutoConfig, AutoModelForSeq2SeqLM
from bert_crf_model import BertCRFForNER 
import os
import shutil
import warnings
warnings.filterwarnings('ignore')

class NERPipeline:
    """
    Custom NER Pipeline for BERT+CRF Model
    """
    
    def __init__(self, model, tokenizer, label_map):
        self.model = model
        self.tokenizer = tokenizer
        self.label_map = label_map
        self.id2label = {v: k for k, v in self.label_map.items()} 
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model.to(self.device)
        self.model.eval()
    
    def __call__(self, text):
        """
        Extract named entities from text (Modified for robust Sub-token Aggregation)
        """
        # Tokenize
        encoding = self.tokenizer(
            text,
            return_tensors='pt',
            truncation=True,
            max_length=128,
            padding=True,
            return_offsets_mapping=True 
        )
        
        input_ids = encoding['input_ids'].to(self.device)
        attention_mask = encoding['attention_mask'].to(self.device)
        offset_mapping = encoding['offset_mapping'][0]
        
        # Predict
        with torch.no_grad():
            tags_list = self.model.predict(input_ids, attention_mask)
        
        predicted_labels = [self.id2label[tag] for tag in tags_list[0]]
        
        # 💡 FIX 1: Robust Word Aggregation Logic (รวมโทเค็นย่อย)
        entities = []
        current_entity = None
        
        for idx, (label, offset) in enumerate(zip(predicted_labels, offset_mapping)):
            
            start, end = offset.tolist()
            
            if start == end: 
                continue
            
            label_prefix = label[:2]
            entity_type = label[2:] if label.startswith(('B-', 'I-')) else None

            # 2. Start of a new entity (B-TAG)
            if label_prefix == 'B-':
                if current_entity:
                    entities.append(current_entity)
                
                # Start new entity
                current_entity = {
                    'word': text[start:end].replace(' ', '').replace('##', ''), # Clean up tokenization artifacts
                    'entity_group': entity_type,
                    'score': 1.0, 
                    'start': start,
                    'end': end
                }
            
            # 3. Continuation of entity (I-TAG)
            elif label_prefix == 'I-' and current_entity and entity_type == current_entity['entity_group']:
                current_entity['end'] = end 
                current_entity['word'] = text[current_entity['start']:current_entity['end']].replace(' ', '').replace('##', '')
            
            # 4. Not an entity (O) or Tag Mismatch
            else: 
                if current_entity:
                    entities.append(current_entity)
                current_entity = None
                
        # 5. Don't forget last entity
        if current_entity:
            entities.append(current_entity)
            
        # 💡 FIX 2: กรอง (Filter) เอนทิตีที่เป็นปัญหาในภาษาญี่ปุ่น (ตัวอักษรเดียวที่ถูก Tag ผิด)
        final_entities = []
        for entity in entities:
             # อนุญาตให้ทุกเอนทิตีที่ไม่ใช่ TECH ผ่านไปได้ (เช่น ถ้ามี Tag อื่นเพิ่มในอนาคต)
             # สำหรับ TECH ให้ผ่านไปได้เฉพาะคำที่ยาวกว่า 1 ตัวอักษร
             if entity['entity_group'] != 'TECH' or len(entity['word']) > 1:
                final_entities.append(entity)
        
        return final_entities
    
    @classmethod
    def from_pretrained(cls, model_path):
        """
        Load NER Pipeline from pretrained model
        """
        # Import here to avoid circular import
        from bert_crf_model import BertCRFForNER
        
        # Load label mappings
        label_map_full = None
        label_paths = [
            f"{model_path}/label_mappings",
            f"{model_path}/label_mappings.json",
        ]
        
        for label_path in label_paths:
            if os.path.exists(label_path):
                try:
                    with open(label_path, 'r', encoding='utf-8') as f:
                        label_map_full = json.load(f)
                    print(f"✅ Loaded label_mappings from: {label_path}")
                    break
                except Exception as e:
                    print(f"⚠️  Failed to load {label_path}: {e}")
                    continue
        
        if label_map_full and 'tag2idx' in label_map_full:
            label_map = label_map_full['tag2idx']
        else:
            print("⚠️  Using default label mappings")
            label_map = {
                "O": 3, 
                "B-TECH": 1,
                "I-TECH": 2,
                "PAD": 0
            }

        # FIX: แก้ไข Key Error: 'BERT + CRF' และตั้งค่า num_labels
        try:
            config = AutoConfig.from_pretrained(model_path)
        except KeyError as e:
            if str(e).strip("'") == 'BERT + CRF':
                print("⚠️ AutoConfig failed with KeyError: 'BERT + CRF'. Attempting fix by modifying config.json.")
                config_file_path = f"{model_path}/config.json"
                if os.path.exists(config_file_path):
                    with open(config_file_path, 'r', encoding='utf-8') as f:
                        config_data = json.load(f)
                    config_data['model_type'] = 'bert'
                    with open(config_file_path, 'w', encoding='utf-8') as f:
                        json.dump(config_data, f, indent=2)
                    print("✅ config.json modified to set 'model_type': 'bert'. Reloading config.")
                    config = AutoConfig.from_pretrained(model_path)
                else:
                    raise
            else:
                raise
        
        config.num_labels = len(label_map)
        print(f"✅ Set config.num_labels to {config.num_labels} based on label_map.")
        
        # Load tokenizer
        tokenizer = AutoTokenizer.from_pretrained(model_path)
        
        # Load model with ignore_mismatched_sizes=True 
        model = BertCRFForNER.from_pretrained(
            model_path,
            config=config,
            ignore_mismatched_sizes=True 
        )
        
        return cls(model, tokenizer, label_map)