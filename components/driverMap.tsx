"use client";
import React, { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import syncData from "@/lib/firebase/syncData";

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
  const [nextStop, setNextStop] = useState<any>();
  const [newPosition, setNewPosition] = useState<{
    lat: number;
    lng: number;
  }>();
  const [posts, setPosts] = useState<any>();
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
    syncData(newPosition as any, nextStop, routeCoordinates, { center, zoom });
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
        zoom: 10,
      });

      // Draw route
      const directionsRenderer = new google.maps.DirectionsRenderer();
      directionsRenderer.setMap(map);
      directionsRenderer.setOptions({
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: "blue",
          strokeOpacity: 0.6,
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
            radius: 100,
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
    }
    if (!isMoving) {
      if (currentPosition === coordinates.length - 1) {
        setCurrentPosition(0);
        setIsMoving((prevState) => !prevState);
      }
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
    <div>
      <div ref={mapContainerRef} style={{ width: "100%", height: "70vh" }} />
      <div>
        <p>Next Stop: {nextStop?.name}</p>
        <p>Remaining Distance: {nextStop?.distance}</p>
        <p>Remaining Duration: {nextStop?.duration}</p>
      </div>
      <button
        onClick={handleToggleMovement}
        className={`p-4 ${
          isMoving ? "bg-red-500 text-red-100" : "bg-green-500 text-green-100"
        }`}
      >
        {isMoving ? "Stop" : "Start"} Bus
      </button>
    </div>
  );
};

export default GoogleMapComponent;
