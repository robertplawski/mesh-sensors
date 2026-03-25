"use client"
import {Loader2} from "lucide-react";
import {nameToColor} from "@/lib/utils";
import { CartesianGrid, Line, XAxis, Area, LineChart, YAxis } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartConfig } from "../ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "../ui/skeleton";
import { useEffect, useMemo, useState } from "react";
import { BackendType } from "../types/Backend-data";
import React from "react";
export const description = "Temperature chart by node";
type FlatObject = Record<string, number>;


function aggregateByBucket(data: any, targetLength){
const chunkSize = Math.floor(arr.length / targetLength);
  return Array.from({ length: targetLength }, (_, i) => {
    const chunk = arr.slice(i * chunkSize, (i + 1) * chunkSize);
    const keys = Object.keys(chunk[0]);
    const aggregated = {};
    keys.forEach(key => {
      aggregated[key] = chunk.reduce((sum, obj) => sum + obj[key], 0) / chunk.length;
    });
    return aggregated;
  });
}
const ChartComponent = ({type, unit}:{ unit:string,type:string})=> {
const [chartConfig,setChartConfig] = useState<ChartConfig>({});
        const[message,setMessage] = useState<string | null>(null);
          const [data, setData] = useState<any[] | undefined >(undefined);
      const [loading, setLoading] = useState(false);
             const [timeRange, setTimeRange] = useState<string>("1m")

      const seconds = useMemo(()=>{
                if(timeRange == "7d") return 24*60*60*7;

        if(timeRange == "3d") return 24*60*60*3;
        if(timeRange == "1d") return 86400;
        if(timeRange == "1h") return 3600;
        
        if(timeRange == "30m") return 30*60;
        if(timeRange == "15m") return 900
        if(timeRange == "1m") return 60;
      },[timeRange]);
    
      useEffect(() => {
          const fetchData = async () => {
        if(loading) return;
        setLoading(true);
        try {
          const res = await fetch(`proxy/api/chart/${type}?seconds=${seconds}`); // lub zewnvtrzny URL
          const json = await res.json();
          setData(json);

          setLoading(false);

        } catch (err) {
          setMessage("Servers are offline come back later.")
        } finally {
            setMessage(null);

          setLoading(false);
        }
      };
      fetchData();
        const interval = setInterval(fetchData, (seconds/10) * 1000);
    
        return () => clearInterval(interval);
      }, [type, seconds]);
	

const [labelNames,setLabelNames] = useState([]);
useEffect(()=>{
const fetchData = async () => {
const res = await fetch(`proxy/api/all_node_names`);
const names = await res.json();
const localLabelNames = [...names, "average"];
setLabelNames(localLabelNames)
setChartConfig(Object.fromEntries(
  localLabelNames.map(name => [name, { label: name, color: nameToColor(name) }])
) satisfies ChartConfig);
}
fetchData();
},[])

      let min = 100
      let max = 0
if(data != undefined){
  const values = data.flatMap((d: any) => labelNames.map((name: string) => d[name])).filter((v: any) => v != null);
  min = Math.min(...values) * 0.9;
  max = Math.max(...values) * 1.1;
}
        
   return(
              <Card className="flex w-[95%] pt-0">
          <CardHeader className="w-full flex  gap-4 space-y-0 items-center justify-center border-b py-5 flex-row">
            <div className="flex-1 gap-2 flex-col sm:flex-row">
              <CardTitle><span className="capitalize">{type}</span> chart by node</CardTitle>
              <CardDescription className="w-full ">
                Showing {type} data over time
              </CardDescription>
            </div>

	  {loading && <Loader2 className="animate-spin"/>}

          <Select value={timeRange} onValueChange={setTimeRange}>

		  <>
          <SelectTrigger
            className=" w-[160px] rounded-lg sm:ml-auto"
            aria-label="Select a value"
          >
            <SelectValue placeholder="last minute" />
          </SelectTrigger>

          <SelectContent className="relative rounded-xl">
            <SelectItem value="1m" className="rounded-lg">
              Last minute
            </SelectItem>
            <SelectItem value="15m" className="rounded-lg">
              Last 15 minutes
            </SelectItem>
               <SelectItem value="30m" className="rounded-lg">
              Last 30 minutes
            </SelectItem>
            <SelectItem value="1h" className="rounded-lg">
              Last hour
            </SelectItem>
            <SelectItem value="1d" className="rounded-lg">
              Last day
            </SelectItem>
                  <SelectItem value="3d" className="rounded-lg">
              Last 3 days
            </SelectItem>
                     <SelectItem value="7d" className="rounded-lg">
              Last week
            </SelectItem>

          </SelectContent>
	  </>

        </Select>  
	
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[250px] w-full"
            >
             
              {data && data.length > 0  ? (
               
                <LineChart data={data}>
                <defs>
                  <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-desktop)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-desktop)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  
                  <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-mobile)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-mobile)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                { data != undefined &&  <YAxis tickLine={false} domain={[min,max]} axisLine={false} tickFormatter={(value) => Math.round(value).toString()} tickFormatter={(value)=>value.toFixed(1)+unit}  allowDataOverflow={true}/>}
                <XAxis
                  dataKey="timestamp"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) => {
                    const date = new Date(value*1000)
                    return date.toLocaleTimeString("pt-PT", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                />
              
                <ChartTooltip   
                
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {	
                        return type
                 
                      }}
                      indicator="dot"
                    />
                  }
                />
		{labelNames?.map((v)=><Line
                  dataKey={v}
                  type="natural"
                  fill={`url(#fill${v})`}
                  stroke={`var(--color-${v})`}
                  stackId={v}
                  connectNulls/>)}
           
                <ChartLegend content={<ChartLegendContent />} />
              </LineChart>): (<div className="w-full h-full text-center justify-center items-center flex -translate-y-5 text-base opacity-60"><p>no data, try selecting different cutoff</p></div>)}
            </ChartContainer>
          </CardContent>
        </Card>
   );
}


export default ChartComponent;
