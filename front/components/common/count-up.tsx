import AnimatedNumber from "react-awesome-animated-number";
import "react-awesome-animated-number/dist/index.css";

const CountUp = ({ to, size }: { to: number; size: number }) => {
  return (
    <AnimatedNumber value={to} hasComma={true} size={size} duration={500} />
  );
};

export default CountUp;
