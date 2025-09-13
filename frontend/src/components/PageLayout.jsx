import React from "react";
import { Box, Container, Card, CardContent, Avatar, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

const GradientBox = styled(Box)(({ theme }) => ({
  background: "linear-gradient(135deg, #100827 0%, #1a0f3d 50%, #291a54 100%)",
  minHeight: "100vh",
  width: "100%",
  color: "white",
  position: "relative",
  overflowX: "hidden",
}));

const HeaderCard = styled(Card)(({ theme }) => ({
  background: "linear-gradient(90deg, #1a0f3d 0%, #23164a 50%, #2d1a54 100%)",
  border: "1px solid rgba(126, 87, 194, 0.5)",
  boxShadow: "0 4px 30px rgba(0, 0, 0, 0.5)",
  marginBottom: theme.spacing(4),
}));

export default function PageLayout({
  children,
  maxWidth = "xl",
  center = false,
  headerIcon = null,
  title = "",
  subtitle = "",
  contentGutter = 4,
  rightHeaderContent = null,
}) {
  return (
    <GradientBox sx={{ display: center ? "grid" : "block", placeItems: center ? "center" : "initial" }}>
      <Container maxWidth={maxWidth} sx={{ py: contentGutter }}>
        {(title || subtitle || headerIcon || rightHeaderContent) && (
          <HeaderCard>
            <CardContent sx={{ p: 4 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={3}>
                  {headerIcon ? (
                    <Avatar
                      sx={{
                        width: 80,
                        height: 80,
                        background: "linear-gradient(135deg, #7b1fa2, #f50057)",
                        boxShadow: "0 4px 20px rgba(123,31,162,0.4)",
                      }}
                    >
                      {headerIcon}
                    </Avatar>
                  ) : null}
                  <Box>
                    {title ? (
                      <Typography
                        variant="h3"
                        component="h1"
                        fontWeight="bold"
                        sx={{
                          background: "linear-gradient(to right, #a0d8ff, #ff80ab)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          mb: subtitle ? 1 : 0,
                        }}
                      >
                        {title}
                      </Typography>
                    ) : null}
                    {subtitle ? <Typography variant="h6" sx={{ color: "#aaa" }}>{subtitle}</Typography> : null}
                  </Box>
                </Box>
                {rightHeaderContent}
              </Box>
            </CardContent>
          </HeaderCard>
        )}

        <Box sx={{ mx: "auto" }}>{children}</Box>
      </Container>
    </GradientBox>
  );
}