import { useRef, useState } from 'react';
import '../login/login-new.css';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import AuthService from '../../../services/auth.service';
import { Wallet } from 'lucide-react';
import Button from '../../../components/ui/Button';

function Register() {
    const navigate = useNavigate();
    const { register, handleSubmit, watch, formState } = useForm();
    const password = useRef({});
    password.current = watch('password', "");
    const [response_error, setResponseError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (data) => {
        setIsLoading(true)
        await AuthService.register_req(data.username, data.email, data.password).then(
            (response) => {
                if (response.data.status === "SUCCESS") {
                    setResponseError("");
                    navigate(`/auth/userRegistrationVerfication/${data.email}`);
                } else {
                    setResponseError("Registration failed: Something went wrong!")
                }
            },
            (error) => {
                if (error.response) {
                    setResponseError(
                        error.response.data.response ||
                        "Registration failed: please review your details and try again."
                    );
                } else {
                    setResponseError("Registration failed: unable to reach the server.")
                }
            }
        );
        setIsLoading(false);
    }

    return (
        <div className='auth-page'>
            <div className='auth-page__container' style={{ maxWidth: '460px' }}>
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
                        <h1 className='auth-card__title'>Create account</h1>
                        <p className='auth-card__subtitle'>Start managing your finances smarter</p>
                    </div>

                    <form className="auth-form-new" onSubmit={handleSubmit(onSubmit)}>
                        {response_error !== "" && <div className='auth-form__error'>{response_error}</div>}

                        <div className='auth-form__group'>
                            <label className='auth-form__label'>Username</label>
                            <input
                                type='text'
                                className='auth-form__input'
                                placeholder='Enter username'
                                {...register('username', { required: "Username is required!" })}
                            />
                            {formState.errors.username && <span className='auth-form__error-text'>{formState.errors.username.message}</span>}
                        </div>

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
                                placeholder='Minimum 8 characters'
                                {...register('password', {
                                    required: 'Password is required!',
                                    minLength: { value: 8, message: "Password must have at least 8 characters" }
                                })}
                            />
                            {formState.errors.password && <span className='auth-form__error-text'>{formState.errors.password.message}</span>}
                        </div>

                        <div className='auth-form__group'>
                            <label className='auth-form__label'>Confirm Password</label>
                            <input
                                type='password'
                                className='auth-form__input'
                                placeholder='Re-enter password'
                                {...register('cpassword', {
                                    required: 'Confirm password is required!',
                                    validate: cpass => cpass === password.current || "Passwords do not match!"
                                })}
                            />
                            {formState.errors.cpassword && <span className='auth-form__error-text'>{formState.errors.cpassword.message}</span>}
                        </div>

                        <Button type='submit' variant='primary' size='lg' style={{ width: '100%' }} disabled={isLoading}>
                            {isLoading ? "Creating account..." : 'Create Account'}
                        </Button>

                        <div className='auth-form__footer'>
                            Already have an account? <Link to='/auth/login' className='auth-form__link'>Sign in</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Register;
