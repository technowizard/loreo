import { AuthBrandPanel, MobileBrandHeader } from '@/features/auth/components/brand-panel';
import { RegisterForm } from '@/features/auth/components/register-form';

function RegisterPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative m-4 hidden lg:block">
        <AuthBrandPanel />
      </div>
      <div className="flex flex-col">
        <MobileBrandHeader />
        <div className="flex flex-1 items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-xs">
            <RegisterForm />
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
