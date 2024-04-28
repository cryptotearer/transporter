"use client";
import React, { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { collection, getDocs, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import "firebase/firestore";

const GoogleMapComponent: React.FC = () => {
  const directionsRendererRef = useRef<any>();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const [data, setData] = useState<any>();

  const { center } = data || {};

  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      version: "weekly",
      libraries: ["geometry"],
    });

    const initializeMap = async () => {
      const map = new google.maps.Map(mapContainerRef.current!, {
        center,
        zoom: 10,
      });

      directionsRendererRef.current = new google.maps.DirectionsRenderer();
      directionsRendererRef.current.setMap(map);
      directionsRendererRef.current.setOptions({
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: "#0000FF",
          strokeOpacity: 0.6,
          strokeWeight: 5,
        },
      });
      circleRef.current = new google.maps.Circle({
        strokeColor: "#0000FF",
        strokeOpacity: 0.4,
        strokeWeight: 4,
        fillColor: "#0000FF",
        fillOpacity: 1,
        map,
        center: { lat: 0, lng: 0 },
        radius: 100,
        zIndex: 1,
      });
    };

    loader.load().then(initializeMap);
  }, [center]);

  useEffect(() => {
    const listenForRealtimeUpdates = async () => {
      const querySnapshot = await getDocs(collection(db, "syncData"));
      if (querySnapshot.empty) {
        return;
      }

      const docRef = doc(db, "syncData", querySnapshot.docs[0].id);
      onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setData(data);
        }
      });
    };

    listenForRealtimeUpdates();
  }, []);

  useEffect(() => {
    if (!data) return;

    const { position, waypoints } = data;
    const { current: map } = mapContainerRef;
    const { current: circle } = circleRef;

    if (!map || !position || !waypoints) return;

    const directionsService = new google.maps.DirectionsService();
    const waypoint = waypoints
      .slice(1, -1)
      .map((coord: any) => ({ location: coord, stopover: true }));
    const request = {
      origin: waypoints[0],
      destination: waypoints[waypoints.length - 1],
      waypoints: waypoint,
      travelMode: google.maps.TravelMode.DRIVING,
      provideRouteAlternatives: false,
      optimizeWaypoints: false,
    };

    directionsService.route(request as any, (result, status) => {
      if (
        status === google.maps.DirectionsStatus.OK &&
        directionsRendererRef.current
      ) {
        directionsRendererRef.current.setDirections(result);
        if (circleRef.current) {
          circleRef.current.setCenter(position);
          circleRef.current.setRadius(100);
          circle?.setCenter(position);
        }
      } else {
        console.error("Directions request failed due to " + status);
      }
    });
  }, [data]);

  return (
    <div>
      <div ref={mapContainerRef} style={{ width: "100%", height: "70vh" }} />
      <div>
        <p>Next Stop: {data?.nextStop?.name}</p>
        <p>Remaining Distance: {data?.nextStop?.distance}</p>
        <p>Remaining Duration: {data?.nextStop?.duration}</p>
      </div>
    </div>
  );
};

export default GoogleMapComponent;
