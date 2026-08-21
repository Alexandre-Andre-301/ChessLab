type inputProp = {
    type : string
    placeholder ?: string
}

export const Input = ({type , placeholder}: inputProp )=>{

    return(
        <input type={type} placeholder={placeholder} />

    )

}