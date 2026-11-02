'use client';
import { useEffect, useState } from 'react';

const labels = {
  az: ['Gün', 'Saat', 'Dəqiqə', 'Saniyə'],
  ru: ['Дней', 'Часов', 'Минут', 'Секунд'],
  en: ['Days', 'Hours', 'Minutes', 'Seconds'],
};

export default function Countdown({ date, locale }: { date: string; locale: 'az'|'ru'|'en' }) {
  const [values, setValues] = useState([0, 0, 0, 0]);

  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, new Date(date).getTime() - Date.now());
      setValues([
        Math.floor(diff / 86400000),
        Math.floor(diff / 3600000) % 24,
        Math.floor(diff / 60000) % 60,
        Math.floor(diff / 1000) % 60,
      ]);
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [date]);

  return <div className="countdown">
    {values.map((value, i) => <div className="countdown-item" key={i}>
      <strong>{String(value).padStart(2, '0')}</strong>
      <span>{labels[locale][i]}</span>
    </div>)}
  </div>;
}
