"use client";
import React, { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import syncData from "@/lib/firebase/syncData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import Link from "next/link";

interface MapProps {
  zoom: number;
  apiKey: string;
  center: google.maps.LatLngLiteral;
  routeCoordinates: { lat: number; lng: number }[];
}

const GoogleMapComponent: React.FC<MapProps> = ({
  apiKey,
  center,
  zoom,
  routeCoordinates,
}) => {
  const [nextStop, setNextStop] = useState<any>({
    name: "",
    duration: "",
    distance: "",
  });
  const [newPosition, setNewPosition] = useState<{
    lat: number;
    lng: number;
  }>({
    lat: 0,
    lng: 0,
  });
  const [posts, setPosts] = useState<any>();
  const [message, setMessage] = useState<string>("");
  const directionsRendererRef = useRef<any>();
  const [isMoving, setIsMoving] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const [nextStopIndex, setNextStopIndex] = useState<number>(0);
  const [currentPosition, setCurrentPosition] = useState<number>(0);
  const [coordinates, setCoordinates] = useState<
    { lat: number; lng: number }[]
  >([]);

  useEffect(() => {
    if (!newPosition && !routeCoordinates && !nextStop) return
    syncData(newPosition, nextStop, routeCoordinates, { center, zoom });
  }, [newPosition, center, routeCoordinates, zoom, nextStop]);

  useEffect(() => {
    let isMounted = true;

    const loader = new Loader({
      apiKey,
      version: "weekly",
      libraries: ["geometry"],
    });

    loader.load().then(() => {
      const map = new google.maps.Map(mapContainerRef.current!, {
        center,
        zoom: 15,
      });

      // Draw route
      const directionsRenderer = new google.maps.DirectionsRenderer();
      directionsRenderer.setMap(map);
      directionsRenderer.setOptions({
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: "blue",
          strokeOpacity: 0.4,
          strokeWeight: 5,
        },
      });
      directionsRendererRef.current = directionsRenderer;
      const directionsService = new google.maps.DirectionsService();
      const waypoints = routeCoordinates
        .slice(1, -1)
        .map((coord) => ({ location: coord, stopover: true }));
      const request = {
        origin: routeCoordinates[0],
        destination: routeCoordinates[routeCoordinates.length - 1],
        waypoints: waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: false,
        optimizeWaypoints: false,
      };

      directionsService.route(request as any, (result, status) => {
        if (!isMounted) return;

        if (status === google.maps.DirectionsStatus.OK) {
          const route = result.routes[0];
          const legs = route.legs;
          setPosts(legs as any);

          directionsRenderer.setDirections(result);
          const polyline = result.routes[0].overview_polyline;
          const decodedPath =
            google.maps.geometry.encoding.decodePath(polyline);
          const coordinatesA = decodedPath.map((latlng) => ({
            lat: latlng.lat(),
            lng: latlng.lng(),
          }));
          setCoordinates(coordinatesA);
          circleRef.current = new google.maps.Circle({
            strokeColor: "#0000FF",
            strokeOpacity: 0.4,
            strokeWeight: 4,
            fillColor: "#0000FF",
            fillOpacity: 1,
            map,
            center: coordinatesA[0],
            radius: 150,
            zIndex: 1,
          });
        } else {
          console.error("Directions request failed due to " + status);
        }
      });

      return () => {
        isMounted = false;
      };
    });
  }, [apiKey, center, zoom, routeCoordinates]);

  useEffect(() => {
    if (!isMoving && coordinates.length === 0) return;

    let moveInterval: NodeJS.Timeout;
    const distanceThreshold = 20;

    const moveCircle = () => {
      const distance = google.maps.geometry.spherical?.computeDistanceBetween(
        new google.maps.LatLng(
          coordinates[currentPosition]?.lat,
          coordinates[currentPosition]?.lng
        ),
        new google.maps.LatLng(
          routeCoordinates[nextStopIndex]?.lat,
          routeCoordinates[nextStopIndex]?.lng
        )
      );

      if (distance < distanceThreshold) {
        let currentPost = posts && posts[nextStopIndex];
        setNextStop({
          name: currentPost.end_address,
          duration: currentPost.duration.text,
          distance: currentPost.distance.text,
        });
        setNextStopIndex((prevIndex) => prevIndex + 1);
      }

      if (currentPosition < coordinates.length - 1) {
        const deltaLat =
          (coordinates[currentPosition + 1].lat -
            coordinates[currentPosition].lat) /
          100;
        const deltaLng =
          (coordinates[currentPosition + 1].lng -
            coordinates[currentPosition].lng) /
          100;
        const newPositionData = {
          lat: coordinates[currentPosition].lat + deltaLat,
          lng: coordinates[currentPosition].lng + deltaLng,
        };
        setNewPosition(newPositionData);
        circleRef.current!.setCenter(newPositionData);
        setCurrentPosition((prevIndex) => prevIndex + 1);
      } else {
        setCurrentPosition(0);
        setIsMoving(false);
      }
    };

    if (isMoving) {
      moveInterval = setInterval(moveCircle, 200);
      setMessage("The bus is moving");
    } else if (currentPosition === coordinates.length - 1) {
        setMessage("Arrived at destination");
        setCurrentPosition(0);
        setIsMoving((prevState) => !prevState);
      } else if((currentPosition < coordinates.length - 1) && !isMoving){
        setMessage("Stopped the bus");
      }

    return () => {
      clearInterval(moveInterval);
    };
  }, [
    isMoving,
    coordinates,
    currentPosition,
    posts,
    nextStop,
    routeCoordinates,
    nextStopIndex,
  ]);

  const handleToggleMovement = () => {
    setIsMoving((prevState) => !prevState);
  };

  return (
        <Card className="mx-auto">
        <CardHeader>
          <div className="flex justify-between">
            <CardTitle className="text-xl">Nyabugogo - Kimironko 
              <span className="font-semibold text-blue-700 bg-blue-100 italic p-1 rounded-full text-sm px-3 mx-2">Driver</span>
            </CardTitle>
            <Link
              href={"/user" }
              target="_blank"
              className={`px-4 py-2  rounded-md font-normal bg-blue-500 text-blue-50`}
            >
                  View As User
            </Link>
          </div>
          <CardDescription>
            <p>Next Stop: <span className="font-bold">{nextStop?.name}</span></p>
            <div className="flex gap-2">
              <p>Distance: <span className="font-bold">{nextStop?.distance}</span> </p>
              <p>Time: <span className="font-bold">{nextStop?.duration}</span></p>
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={handleToggleMovement}
                className={`p-4 mt-2 rounded-md font-bold ${
                  isMoving ? "bg-red-500 text-red-100" : "bg-green-500 text-green-50"
                }`}
              >
                {isMoving ? "Stop" : "Start"} Bus
              </button>

              { message == "Stopped the bus" ? 
              <p className="mt-2 text-red-500 bg-red-100 font-bold p-4 rounded-md">{message}</p>
              : message == "The bus is moving" ?
              <p className="mt-2 text-green-500 bg-green-100 font-bold p-4 rounded-md">{message}</p>
              : <p className="mt-2 text-green-500 bg-green-100 font-bold p-4 rounded-md">{message}</p>
            }

            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div ref={mapContainerRef} style={{ width: "100%", height: "70vh" }} />
        </CardContent>
        </Card>
  );
};

export default GoogleMapComponent;
