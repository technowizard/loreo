import { Eye, EyeSlash } from '@phosphor-icons/react';
import { forwardRef, useState } from 'react';

import { Input } from './input';

type PasswordInputProps = Omit<React.ComponentProps<'input'>, 'type'>;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(props, ref) {
    const [show, setShow] = useState(false);

    return (
      <div className="relative">
        <Input className="pr-10" ref={ref} type={show ? 'text' : 'password'} {...props} />
        <button
          aria-label={show ? 'Hide password' : 'Show password'}
          className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
          onClick={() => setShow((v) => !v)}
          type="button"
        >
          {show ? <EyeSlash size={16} /> : <Eye size={16} />}
        </button>
      </div>
    );
  }
);
