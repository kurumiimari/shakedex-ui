import React from 'react';
import * as punycode from 'punycode/';

export const TLD = (props: { tld: string }) => {
  let parsed;
  try {
    parsed = punycode.toUnicode(props.tld);
  } catch (e) {
    parsed = props.tld;
  }

  return (
    <>
      {parsed}
    </>
  );
};

export default TLD;