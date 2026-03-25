'use client';
import AutomaticTasks from "./AutomaticTasks"
import ControlButton from "./ControlButton.tsx"
import Link from "next/link";
import {Fan,Loader2,LayoutDashboard, Megaphone,Lock} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import Image from "next/image";
import favicon from "@/app/favicon.ico"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
CardHeader,
  Card,
  CardContent,
} from "@/components/ui/card"
import { Map, MapControls, MapMarker, MarkerContent, MarkerPopup, MarkerTooltip } from "@/components/ui/map";
import React, { useCallback, useEffect, useState } from "react"
import { Skeleton } from "./ui/skeleton";
import ChartComponent from "./Chart/Propschart";
import { BackendType } from "./types/Backend-data";
import MapComponent from "./MapComponent/MapComponent";
const items = [
  {
    value: "Robert",
    trigger: "Robert",
    content:''
  },
  {
    value: "Maciek",
    trigger: "Maciek",
    content:
       "67 mango mustard"
  },
];

const useAdminLogin = () => {
	const [errorMessage, setErrorMessage] = useState("");
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [password,setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const login = async (e) => {
		setIsLoading(true)
		e.preventDefault();
		const res = await fetch("/proxy/api/login",{
			method:"POST",	
			headers:{"Content-Type":"application/json"},
			body:JSON.stringify({password})
		})
		setIsLoading(false);
		if(!await res.ok){
			return;
		} 
		const data = await res.json();
		setIsLoggedIn(data?.success)
	}
	const logout = () => {
		setPassword("");
		setIsLoggedIn(false)
	}
	return {isLoggedIn, isLoading, setPassword,login, logout,password}
}

export default function GridTemplate() {  
   const {isLoggedIn, password,setPassword,isLoading:isLoginLoading,login,logout} = useAdminLogin();
   // const {data:allReceived} = useAllReceived();
    const[message,setMessage] = useState<string | null>(null);
      const [data, setData] = useState<BackendType | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("proxy/api/latest"); // lub zewnętrzny URL
      const json = await res.json();
      setData(json);
    } catch (err) {
      setMessage("Servers are offline come back later.")
    } finally {
        setMessage(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 500);

    return () => clearInterval(interval);
  }, []);

  const [now, setNow] = useState(Math.round(Date.now()/1000));
  useEffect(()=>{
    const interval = setInterval(()=>setNow(()=>Math.round(Date.now()/1000)),500);
    return ()=>clearInterval(interval)
  },[setNow])
const fmt = (num, digits = 2) =>
  typeof num === "number" ? num.toFixed(digits) : "N/A";


  const calculate = useCallback(()=>data ? (now - (data.server_timestamp )) : 0, [now,data])
  return (
    <section className="w-full min-md:w-[70%] gap-5 py-6 flex flex-col items-center">
    <div className="flex w-[100%] max-md:w-full items-center justify-center flex-col gap-4">
      <div className="w-[100%] p-5 pl-8 text-xl font-bold flex items-start flex-row gap-4"><Image className={"w-[50px] h-[50px] p-0.5 shadow-lg shadow-white/20 rounded-full"} src={favicon} alt="Circuit Image"></Image><div className="flex flex-col"><h1>Mesh sensors newtork</h1><h2 className="text-neutral-400 text-sm">RaspberryPI + LoRa + Arduino</h2></div></div>
      <div className="w-[95%] grid grid-cols-3 gap-4">

        {data ? (<>
                        <Card className="p-6 h-[150px] flex justify-center items-center text-sm text-neutral-400 font-bold flex-col rounded-lg text-center">Last scan<div className="text-xl text-white">{calculate()} s ago</div></Card>

        <Card className="p-6 h-[150px] flex justify-center items-center text-sm text-neutral-400 font-bold flex-col rounded-lg text-center">Temperature <div className="text-xl text-white">{data &&  data.avg_temperature}°C</div></Card>
        <Card className="p-6 h-[150px] flex justify-center items-center text-sm text-neutral-400 font-bold flex-col rounded-lg text-center">Pressure <div className="text-xl text-white">{data && data.avg_pressure}hPa</div></Card>
        <Card className="p-6 h-[150px] flex justify-center items-center text-sm text-neutral-400 font-bold flex-col rounded-lg text-center">Node Count <div className="text-xl text-white">{data && data.count}</div></Card>
        <Card className="p-6 h-[150px] flex justify-center items-center text-sm text-neutral-400 font-bold flex-col rounded-lg text-center">Humidity <div className="text-xl text-white">{data && data.avg_humidity}%</div></Card>
    <Card className="p-6 h-[150px] flex justify-center items-center text-sm text-neutral-400 font-bold flex-col rounded-lg text-center">Gas <div className="text-xl text-white">{data && (data.avg_gas/1000).toFixed(2)}kΩ</div></Card>
   <Card className="p-6 h-[150px] flex justify-center items-center text-sm text-neutral-400 font-bold flex-col rounded-lg text-center">VOC <div className="text-xl text-white">{data && data.avg_voc}ppb</div></Card>
      <Card className="p-6 h-[150px] flex justify-center items-center text-sm text-neutral-400 font-bold flex-col rounded-lg text-center">CO2 <div className="text-xl text-white">{data && data.avg_co2}ppm</div></Card>
          </>) : (
            <>
                    <Card className="p-6 h-[150px] flex justify-center items-center text-sm text-neutral-400 font-bold flex-col rounded-lg text-center">Time</Card>
        <Card className="p-6 h-[150px] flex justify-center items-center text-sm text-neutral-400 font-bold flex-col rounded-lg text-center">Temperature</Card>
        <Card className="p-6 h-[150px] flex justify-center items-center text-sm text-neutral-400 font-bold flex-col rounded-lg text-center">Pressure</Card>
        <Card className="p-6 h-[150px] flex justify-center items-center text-sm text-neutral-400 font-bold flex-col rounded-lg text-center">Node Count</Card>
        <Card className="p-6 h-[150px] flex justify-center items-center text-sm text-neutral-400 font-bold flex-col rounded-lg text-center">Humidity</Card>
            <Card className="p-6 h-[150px] flex justify-center items-center text-sm text-neutral-400 font-bold flex-col rounded-lg text-center">Gas</Card>
   <Card className="p-6 h-[150px] flex justify-center items-center text-sm text-neutral-400 font-bold flex-col rounded-lg text-center">VOC</Card>
      <Card className="p-6 h-[150px] flex justify-center items-center text-sm text-neutral-400 font-bold flex-col rounded-lg text-center">CO2</Card>
            </>
          )}
      </div>
    </div>      
    <Card className="w-[95%] min-md:h-[500px] max-md:aspect-video overflow-hidden p-0!">
      <CardContent className="w-full h-full mx-0 px-0">
        {data ? <MapComponent data={data}></MapComponent> : <Skeleton className="h-[500px] w-[100%] text-sm text-neutral-400 flex justify-center items-center direction-row">There is no data to display</Skeleton>}
    </CardContent>
    </Card>
	{isLoggedIn ? <><Card className="max-md:aspect-video w-[95%] p-6 ">

<CardContent className="w-full h-full mx-0 px-0 gap-6 flex flex-col">

		<div className="flex justify-center relative flex-row sm:flex-col gap-4 flex-wrap">
		<p className='text-lg  font-semibold'>Control dashboard</p>

	<Button onClick={logout} className="absolute right-0">Logout</Button>

		</div>
		<div className='flex flex-col gap-4 ' >
			{data && data.records.map((rec) => (
        <div
          key={rec.id}
          className="
            bg-neutral-700/20
            text-white
            p-4
            rounded-lg
            transition-colors
            shadow-md
          "
        >
          {/* Header */}
          <div className="flex justify-between items-center">
            <span className="font-semibold text-lg">
              {rec.name}
            </span>
            <div className="text-sm text-neutral-400 flex flex-row gap-4">
              <span>lat: {rec.lat}</span>
	      <span>lon: {rec.lon} </span>
              <span>address: {rec.node_id || 0} </span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1 text-sm">
            <p>
              <span className="font-bold">Temp:</span> {fmt(rec.temperature)} °C
            </p>
            <p>
              <span className="font-bold">Humidity:</span> {fmt(rec.humidity, 1)} %
            </p>
            <p>
              <span className="font-bold">Pressure:</span> {fmt(rec.pressure*10)} hPa
            </p>
            <p>
              <span className="font-bold">Gas:</span>{" "}
              {(rec.gas / 1000).toFixed(2) ?? "N/A"} kΩ
            </p>
            <p>
              <span className="font-bold">VOC:</span> {rec.voc}
            </p>
            <p>
              <span className="font-bold">CO2:</span> {rec.co2} ppm
            </p>
            <p className=" h-full flex items-center flex flex-row w-full gap-4">
              <span className="font-bold ">Motion detected:</span>{" "}
		<span>{rec.motion ? "YES" : "NO"}</span>
              </p>
	      <ControlButton password={password} record={rec} type="motor"><Fan/> Fan </ControlButton>
	      <ControlButton password={password} record={rec} type="buzzer"><Megaphone/> Buzzer </ControlButton>
    
          </div>

        </div>))}

		</div>

		
</CardContent>
	</Card>
	<Card className="px-6 py-6 w-[95%] flex flex-col">
		<p className='text-lg  font-semibold'>Automatic tasks</p>

		<div className="grid grid-cols-[1fr_1fr] w-full ">		
		<AutomaticTasks data={data}/>
		</div>

	</Card></> : <Card className="px-8 flex-row flex w-[95%] items-center">
		<form onSubmit={login} className="gap-6 flex-row flex w-[100%] max-w-3xl items-center">
		<Lock className="scale-[2]"/>
		<p className="text-lg font-semibold whitespace-nowrap sm:flex-row flex-col">Enter your admin password</p>
		<Input type="password"  value={password} onChange={(e)=>setPassword(e.target.value)}/> <Button type="submit">{isLoginLoading ? <Loader2 className="animate-spin"/> : "Login"} </Button>
		</form>
	</Card>}

    <div className="flex w-[100%] items-center justify-center flex-col gap-6">

      {data && (<><ChartComponent unit="°C" type={"temperature"}></ChartComponent>
      <ChartComponent unit="%" type={"humidity"}></ChartComponent>
      <ChartComponent unit=" hPa" type={"pressure"}></ChartComponent>

      <ChartComponent unit="Ω" type={"gas"}></ChartComponent>

      <ChartComponent unit="ppb" type={"voc"}></ChartComponent>

      <ChartComponent unit="ppm" type={"co2"}></ChartComponent>
        </>)}
    </div>
    </section>
  );
}
