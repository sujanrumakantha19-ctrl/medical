'use client';

import { useState, useEffect } from 'react';

interface FormattedDateProps {
  date: string | Date;
}

export function FormattedDate({ date }: FormattedDateProps) {
  const [formatted, setFormatted] = useState<string>('');

  useEffect(() => {
    if (!date) {
      setFormatted('N/A');
      return;
    }
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      setFormatted('Invalid Date');
    } else {
      setFormatted(d.toLocaleDateString());
    }
  }, [date]);

  return <>{formatted}</>;
}
