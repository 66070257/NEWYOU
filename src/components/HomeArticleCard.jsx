import React from "react";
import { Button, Card, CardActions, CardContent, CardMedia, Typography } from "@mui/material";

const HomeArticleCard = ({ title, description, image }) => {
    return (
        <Card sx={{ borderRadius: 4 }}>
            <CardMedia component="img" height="180" image={image} alt="article" />
            <CardContent>
                <Typography variant="h6">{title}</Typography>
                <Typography variant="body2" color="text.secondary">
                    {description}
                </Typography>
            </CardContent>
            <CardActions>
                <Button size="small">LIKE</Button>
                <Button size="small">DISLIKE</Button>
            </CardActions>
        </Card>
    );
};

export default HomeArticleCard;
