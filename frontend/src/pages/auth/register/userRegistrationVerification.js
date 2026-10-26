import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {useForm} from 'react-hook-form';
import AuthService from '../../../services/auth.service';

const UserRegistrationVerfication = () => {
    const navigate = useNavigate();
    
    const { email } = useParams(); 

    const {register, handleSubmit, formState} = useForm();

    const [response_error, setResponseError] = useState("");
    const [resendStatus, setResendStatus] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const onSubmit = async (data) => {
        setIsLoading(true)        
        await AuthService.verifyRegistrationVerificationCode(data.code).then(
            (response) => {
                if (response.data.status === "SUCCESS") {
                    navigate('/auth/success-registration')
                    setResponseError("");
                }else {
                    setResponseError("Verification failed: please check the code and try again.")
                }
            },
            (error) => {
                if (error.response) {
                    setResponseError(error.response.data.response);
                }else {
                    setResponseError("Verification failed: unable to reach the server.")
                }
            }
          );
        setIsLoading(false);
    }

    const resendCode = async() =>{
        setIsSending(true)
        setResendStatus("")
        await AuthService.resendRegistrationVerificationCode(email).then(
            (response) => {
                setResponseError("");
                setResendStatus("A new verification code has been sent to " + email + ".");
            },
            (error) => {
                setResendStatus("");
                setResponseError(
                    error.response?.data?.response ||
                    "We could not resend the verification email. Try again in a moment."
                );
            }
          );
        setIsSending(false)  
    }

  return (
    <div className='container'>
            <form className="auth-form"  onSubmit={handleSubmit(onSubmit)}>
                <h2>Verify your email</h2><br/>
                {
                    isSending ?
                        <div className='msg'>Sending email to {email}...</div> 
                        : (response_error==="") 
                        ? <div className='msg'>The verification code has been sent to <span style={{fontWeight:600,  color:'green'}}>{email}</span>.</div>
                        : <></>
                }
                {
                    (resendStatus!=="") && <div className='msg' style={{color:'green'}}>{resendStatus}</div>
                }
                {
                    (response_error!=="") && <p>{response_error}</p>
                }
                
                <div className='input-box'>
                    <input 
                    placeholder='Enter verification code'
                        type='text'
                        inputMode='numeric'
                        {...register('code', {
                            required: "Code is required!",
                        })}
                    />
                    {formState.errors.code && <small>{formState.errors.code.message}</small>}
                </div>

                <div className='msg' style={{fontWeight: 600, fontStyle: 'italic'}}>Please note that the verification code expires in 15 minutes.</div>
                <br/>

                <div className='input-box'>
                    <input type='submit' value={isLoading ? "Verifying" : 'Verify'}
                     className={isLoading ? "button button-fill loading" : "button button-fill"}
                    />
                </div>

                <br/>
                <div className='msg'>Having problems? <span style={{cursor: 'pointer'}} onClick={resendCode} className='inline-link'>{isSending ? "Sending code..." : 'Resend code'}</span></div>
            </form>
    </div>
  );
};

export default UserRegistrationVerfication;
