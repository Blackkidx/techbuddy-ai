# ml-service/bert_crf_model.py

import torch
import torch.nn as nn
from transformers import BertPreTrainedModel, BertModel
from torchcrf import CRF

class BertCRFForNER(BertPreTrainedModel):
    """
    BERT + CRF Model for Named Entity Recognition
    """
    
    def __init__(self, config):
        super().__init__(config)
        self.num_labels = config.num_labels
        
        # BERT Base Model
        self.bert = BertModel(config)
        
        # Dropout
        self.dropout = nn.Dropout(config.hidden_dropout_prob)
        
        # Linear layer to project BERT output to label space
        self.classifier = nn.Linear(config.hidden_size, config.num_labels)
        
        # CRF Layer
        self.crf = CRF(config.num_labels, batch_first=True)
        
        # Initialize weights
        self.init_weights()
    
    def forward(
        self,
        input_ids=None,
        attention_mask=None,
        token_type_ids=None,
        labels=None,
        **kwargs
    ):
        # Get BERT outputs
        outputs = self.bert(
            input_ids=input_ids,
            attention_mask=attention_mask,
            token_type_ids=token_type_ids
        )
        
        sequence_output = outputs[0]  # (batch_size, seq_len, hidden_size)
        
        # Apply dropout
        sequence_output = self.dropout(sequence_output)
        
        # Project to label space
        logits = self.classifier(sequence_output)  # (batch_size, seq_len, num_labels)
        
        outputs = (logits,)
        
        if labels is not None:
            # Training: compute CRF loss
            loss = -self.crf(logits, labels, mask=attention_mask.byte(), reduction='mean')
            outputs = (loss,) + outputs
        else:
            # Inference: decode best path
            tags = self.crf.decode(logits, mask=attention_mask.byte())
            outputs = (tags,) + outputs
        
        return outputs
    
    def predict(self, input_ids, attention_mask):
        """
        Predict NER tags for input
        """
        with torch.no_grad():
            outputs = self.forward(
                input_ids=input_ids,
                attention_mask=attention_mask
            )
            tags = outputs[0]  # List of predicted tag sequences
        
        return tags