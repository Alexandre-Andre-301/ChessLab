import { useForm } from "react-hook-form";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import * as z from 'zod';
import { registerSchema } from "../../schemas/registerSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react"; // Adicionado para monitorar erros

// Definição do tipo fora do componente (boa prática de performance)
type FormData = z.infer<typeof registerSchema>;

export const CadastroForm = () => {
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<FormData>({
        resolver: zodResolver(registerSchema)
    });

    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            console.log("Erros de validação travando o envio:", errors);
        }
    }, [errors]);

    const onSubmit = (data: FormData) => {
        console.log('Dados validados e enviados com sucesso:', data);
    };

    return (
        <div>
           <form onSubmit={handleSubmit(onSubmit)}>
                <div>
                    <label>Full Name</label>
                    <Input type="text" placeholder="Name" {...register('fullName')}/>
                    {errors.fullName && <p style={{ color: 'red' }}>{errors.fullName.message}</p>}
                </div>

                <div>
                    <label>Email</label>
                    <Input type="email" placeholder="Email" {...register('email')}/>
                    {errors.email && <p style={{ color: 'red' }}>{errors.email.message}</p>}
                </div>

                <div>
                    <label>Password</label>
                    <Input type="password" placeholder="••••••••" {...register('password')}/>
                    {errors.password && <p style={{ color: 'red' }}>{errors.password.message}</p>}
                </div>

                <Button message="Create Account" type="submit"/>
           </form>
        </div>
    );
};
