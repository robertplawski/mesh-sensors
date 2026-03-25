import { BackendType } from "../types/Backend-data";
import {nameToColor} from "@/lib/utils";
import { MapControls, MapMarker, MarkerContent, MarkerTooltip, MarkerPopup,Map } from "../ui/map";

const MapComponent = ({data}:{data:BackendType}) => {
	if(!data) return;
    return(
        <Map theme="dark"  center={[data.avg_lon , data.avg_lat ]} zoom={15}>
        <MapControls />
        {data && data?.records && data.records.map((location:any) => (
          
          <MapMarker
            color={nameToColor(location.name)}
            key={location.name}
            longitude={location.lon}
            latitude={location.lat}
          >
            <MarkerContent>
              <div className="size-4 rounded-full bg-primary border-2 border-white shadow-lg" />
            </MarkerContent>
            <MarkerTooltip>{location.name}</MarkerTooltip>
            <MarkerPopup>
              <div className="space-y-1">
                <p className="font-medium text-foreground">{location.name}</p>
                <p className="text-xs text-muted-foreground">
                  {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
                </p>
              </div>
            </MarkerPopup>
          </MapMarker>
        ))}
      </Map>
    )
}
export default MapComponent;
