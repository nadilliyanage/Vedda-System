import React from "react";
import { Card, CardContent, Typography, Divider } from "@mui/material";
import { EXAMPLE_PHRASES } from "../../constants/languages";

const ExamplePhrases = ({ onSelectExample }) => {
  return (
    <Card elevation={1} sx={{ borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Try These Examples
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {EXAMPLE_PHRASES.map((example, index) => (
          <Card
            key={index}
            variant="outlined"
            sx={{
              mb: 1,
              cursor: "pointer",
              "&:hover": { bgcolor: "#f5f5f5" },
              borderRadius: 1,
            }}
            onClick={() => onSelectExample(example)}
          >
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                {example.vedda}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {example.english}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};

export default ExamplePhrases;
