import * as React from "react";
import type { InputHTMLAttributes } from "react";

const Input = React.forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>((props, ref) => {
  return <input ref={ref} className="input" {...props} />;
});
Input.displayName = "Input";

export { Input };
export default Input;
