import {PropsWithChildren,useMemo,useEffect,useState,useCallback } from "react";
import {Loader} from "lucide-react";
import {Button} from "@/components/ui/button";

type ActuatorType = "motor" | "buzzer"

interface ControlButtonProps {
	password: string,
	type: ActuatorType,
	enabled: bool
} 

const FAKE_TIMEOUT_SECONDS = 5 * 1000

const useControlActuator = (type: ActuatorType,address:number,password:string) => {
	const [localEnabled,setLocalEnabled] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [response,setResponse] = useState({});

	const actuate = useCallback((on: bool) => {
		if(isLoading) return;
		setIsLoading(true)
		setLocalEnabled(on)
		const command = [type]
		if(type == "motor"){
			const onOrOff = on ? "on" : "off"
			command.push(onOrOff) 
		}
		if(type == "buzzer"){
			const frequency = on ? 800 : 0
			command.push(frequency)
		}
		sendCommand(command.join(","))
		setTimeout(FAKE_TIMEOUT_SECONDS, ()=> setIsLoading(false))
	},[type,password])
		
	const sendCommand = useCallback((command) => {
		fetch(`/proxy/api/send_command`, {
		    method: "POST",
		    headers: {
			"Content-Type": "application/json"
		    },
		    body: JSON.stringify({
			address,
			command, 
			password
		    })
		})
		.then(res => res.json());
	},[type,password])

	

	return {isLoading,localEnabled, actuate}
}

export default function ControlButton({children,record,password,type}: ControlButtonProps & PropsWithChildren){

	const enabled = record[type];
	const {actuate,localEnabled, isLoading} = useControlActuator(type,record["node_id"] || 0,password);
	const label = (localEnabled||enabled) ? "ON" : "OFF"

	return <Button className='flex justify-between flex-row px-8' disabled={isLoading } onClick={()=>actuate(!enabled)}>{children} 

	{isLoading ? <Loader className="animate-spin"/> : <span>{label}</span>}
	</Button> 
}
