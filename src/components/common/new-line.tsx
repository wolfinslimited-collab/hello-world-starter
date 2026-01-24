import React from "react";

const NewLine = ({ message }: { message: string }) => {
  const formattedMessage = message.split("\n").map((line, index) => (
    <React.Fragment key={index}>
      {line}
      <br />
    </React.Fragment>
  ));
  return <div className="text-start">{formattedMessage}</div>;
};

export default NewLine;
