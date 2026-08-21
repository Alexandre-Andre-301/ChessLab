interface buttonProp extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    message : string
    type ?: "submit" | "reset" | "button"
}

export const Button = ({ message, type }: buttonProp) => {
    return (
    <button type={type}>
        {message}
    </button>
    )
}