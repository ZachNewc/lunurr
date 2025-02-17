import React from 'react';
import styles from '../styles/Home.module.css';

const Home: React.FC = () => {
  return (
    <div className={styles.container}>
      <h1>Welcome to the Home Page</h1>
      <p>This is the landing page of your website.</p>
    </div>
  );
};

export default Home;