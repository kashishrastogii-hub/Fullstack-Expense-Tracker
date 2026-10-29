import { useEffect, useState } from 'react';
import './login-new.css';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import AuthService from '../../../services/auth.service';
import { Wallet } from 'lucide-react';
import Button from '../../../components/ui/Button';

function Login() {
    const navigate = useNavigate();

    useEffect(() => {
        if (AuthService.getCurrentUser() && AuthService.getCurrentUser().roles.includes("ROLE_USER")) {
            navigate("/user/dashboard");
        } else if (AuthService.getCurrentUser() && AuthService.getCurrentUser().roles.includes("ROLE_ADMIN")) {
            navigate("/admin/transactions");
        }
    }, [])

    const { register, handleSubmit, formState } = useForm();
    const [response_error, setResponseError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (data) => {
        setIsLoading(true)
        try {
            await AuthService.login_req(data.email, data.password);
            setResponseError("");
            const currentUser = AuthService.getCurrentUser();
            localStorage.setItem("message", JSON.stringify({ status: "SUCCESS", text: "Login successful!" }));
            if (currentUser && currentUser.roles.includes("ROLE_USER")) {
                navigate("/user/dashboard");
            } else if (currentUser && currentUser.roles.includes("ROLE_ADMIN")) {
                navigate("/admin/transactions");
            }
        } catch (error) {
            const resMessage = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            if (resMessage === "Bad credentials") {
                setResponseError("Invalid email or password!");
            } else {
                setResponseError("Something went wrong: Try again later!");
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className='auth-page'>
            <div className='auth-page__container'>
                <div className='auth-page__logo'>
                    <div className='auth-page__logo-icon'>
                        <Wallet size={28} />
                    </div>
                    <div className='auth-page__logo-text'>
                        <span className='auth-page__logo-title'>PocketWise</span>
                        <span className='auth-page__logo-subtitle'>Finance</span>
                    </div>
                </div>

                <div className='auth-card'>
                    <div className='auth-card__header'>
                        <h1 className='auth-card__title'>Welcome back</h1>
                        <p className='auth-card__subtitle'>Sign in to your account to continue</p>
                    </div>

                    <form className="auth-form-new" onSubmit={handleSubmit(onSubmit)}>
                        {response_error !== "" && <div className='auth-form__error'>{response_error}</div>}

                        <div className='auth-form__group'>
                            <label className='auth-form__label'>Email Address</label>
                            <input
                                type='email'
                                className='auth-form__input'
                                placeholder='you@example.com'
                                {...register('email', {
                                    required: "Email is required!",
                                    pattern: { value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/g, message: "Invalid email address!" }
                                })}
                            />
                            {formState.errors.email && <span className='auth-form__error-text'>{formState.errors.email.message}</span>}
                        </div>

                        <div className='auth-form__group'>
                            <label className='auth-form__label'>Password</label>
                            <input
                                type='password'
                                className='auth-form__input'
                                placeholder='Enter your password'
                                {...register('password', {
                                    required: 'Password is required!'
                                })}
                            />
                            {formState.errors.password && <span className='auth-form__error-text'>{formState.errors.password.message}</span>}
                        </div>

                        <div className='auth-form__row'>
                            <Link to={'/auth/forgetpassword/verifyEmail'} className='auth-form__link'>Forgot password?</Link>
                        </div>

                        <Button type='submit' variant='primary' size='lg' style={{ width: '100%' }} disabled={isLoading}>
                            {isLoading ? "Signing in..." : 'Sign In'}
                        </Button>

                        <div className='auth-form__footer'>
                            Don't have an account? <Link to='/auth/register' className='auth-form__link'>Create account</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Login;
