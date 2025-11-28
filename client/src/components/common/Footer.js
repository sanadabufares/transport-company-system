import React from 'react';
import { Container } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-3 mt-auto">
      <Container className="text-center">
        <p className="mb-0">
          &copy; {new Date().getFullYear()} Transportation Company Management System | All Rights Reserved
        </p>
      </Container>
    </footer>
  );
};

export default Footer;
