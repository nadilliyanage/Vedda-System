import React from "react";
import { Card, CardContent, Typography, Divider } from "@mui/material";
import { History } from "@mui/icons-material";

const TranslationHistory = ({ history, onSelectHistoryItem }) => {
  return (
    <Card elevation={1} sx={{ borderRadius: 2 }}>
      <CardContent>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ display: "flex", alignItems: "center" }}
        >
          <History sx={{ mr: 1 }} />
          Recent Translations
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {history.length > 0 ? (
          history.map((item, index) => (
            <Card
              key={index}
              variant="outlined"
              sx={{
                mb: 1,
                cursor: "pointer",
                "&:hover": { bgcolor: "#f5f5f5" },
                borderRadius: 1,
              }}
              onClick={() => onSelectHistoryItem(item)}
            >
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  {item.input_text}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  → {item.output_text}
                </Typography>
              </CardContent>
            </Card>
          ))
        ) : (
          <Typography variant="body2" color="textSecondary">
            No recent translations
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default TranslationHistory;
