import FadeLoader from "react-spinners/FadeLoader";

const Loading = () => {
    return (
        <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',  flexDirection: 'column', color: 'var(--second)'}}>
            <FadeLoader
                color="#6366f1"
                loading={true}
                size={40}
                aria-label="Loading Spinner"
                data-testid="loader"
            />
            <br/>
            <small>Please wait...</small>
        </div>
    )
}

export default Loading;