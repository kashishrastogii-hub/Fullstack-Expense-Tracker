import React from 'react';
import './card.css';

const Card = ({ children, className = '', hover = false, ...props }) => {
  const classes = ['card', hover ? 'card--hover' : '', className].filter(Boolean).join(' ');
  return <div className={classes} {...props}>{children}</div>;
};

const CardHeader = ({ children, className = '', ...props }) => {
  return <div className={'card__header ' + className} {...props}>{children}</div>;
};

const CardTitle = ({ children, className = '', ...props }) => {
  return <h3 className={'card__title ' + className} {...props}>{children}</h3>;
};

const CardDescription = ({ children, className = '', ...props }) => {
  return <p className={'card__description ' + className} {...props}>{children}</p>;
};

const CardContent = ({ children, className = '', ...props }) => {
  return <div className={'card__content ' + className} {...props}>{children}</div>;
};

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;

export default Card;
