import React from 'react';
import GoogleMapComponent from './driverMap';

const MyMapPage: React.FC = () => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string;
  const center = {
    lat: -1.939826787816454,
    lng: 30.0445426438232,
  };
  const zoom = 20;
  const routeCoordinates = [
    { lat: -1.939826787816454, lng: 30.0445426438232 }, // Starting Point
    // Intermediate Stops
    { lat: -1.9355377074007851, lng: 30.060163829002217 },
    { lat: -1.9358808342336546, lng: 30.08024820994666 },
    { lat: -1.9489196023037583, lng: 30.092607828989397 },
    { lat: -1.9592132952818164, lng: 30.106684061788073 },
    { lat: -1.9487480402200394, lng: 30.126596781356923 },
    { lat: -1.9365670876910166, lng: 30.13020167024439 }, // Ending Point
  ];

  return (
    <div className='h-[600px] w-[100%]'>
      <GoogleMapComponent apiKey={apiKey} routeCoordinates={routeCoordinates} center={center} zoom={zoom}/>
    </div>
  );
};

export default MyMapPage;
