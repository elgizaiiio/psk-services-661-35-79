import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import CandyCrushGame from '@/components/games/CandyCrushGame';

const CandyCrush: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Candy Crush | Viral Games</title>
        <meta name="description" content="Play Candy Crush and earn BOLT rewards! Match 3 or more candies to score points." />
        <link rel="canonical" href={`${window.location.origin}/candy-crush`} />
      </Helmet>

      <CandyCrushGame onBack={() => navigate('/mini-games')} />
    </>
  );
};

export default CandyCrush;
