import React, {useEffect, useState} from 'react';
import moment from 'moment';

interface CountdownProps {
  date: number
  doneText?: string
}

export const Countdown = (props: CountdownProps) => {
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setGeneration(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const now = Date.now();
  if (props.date <= now) {
    return (
      <>
        {props.doneText || 'now'}
      </>
    );
  }

  const duration = moment.duration(props.date - now, 'milliseconds');
  const days = duration.days();
  return (
    <>
      {days > 0 ? `${days}d ` : null}
      {padZero(duration.hours())}:{padZero(duration.minutes())}:{padZero(duration.seconds())}
    </>
  );
};

function padZero(input: number): string {
  return input.toString().padStart(2, '0');
}

export default Countdown;