import { collection,getDocs, addDoc,updateDoc, doc } from "firebase/firestore";
import { db, auth  } from './config';
import 'firebase/firestore';

interface Position {
    lat: number;
    lng: number;
}

interface WayPoint {
    lat: number;
    lng: number;
}

type WayPoints = WayPoint[];

interface MapInfo {
    center?: Position;
    zoom?: number;
}

const syncData = async (
    position: Position, 
    nextStop: {
        name: string,
        duration: string,
        distance: string
    },
    waypoints?: WayPoints, 
    mapInfo?: MapInfo,
) => {
    try {
        const querySnapshot = await getDocs(collection(db, "syncData"));
        if (!querySnapshot.empty) {
            // Document exists, update its data
            const docRef = doc(db, "syncData", querySnapshot.docs[0].id);
            await updateDoc(docRef, {
                position: {
                    lat: position.lat,
                    lng: position.lng
                },
                waypoints: waypoints?.map(waypoint => ({
                    lat: waypoint.lat,
                    lng: waypoint.lng
                })),
                mapInfo: {
                    center: {
                        lat: mapInfo?.center?.lat,
                        lng: mapInfo?.center?.lng
                    },
                    zoom: mapInfo?.zoom
                },
                nextStop
            });
            
        } else {
            // Document does not exist, create it
            const docRef = await addDoc(collection(db, "syncData"), {
                position: {
                    lat: position.lat,
                    lng: position.lng
                },
                waypoints: waypoints?.map(waypoint => ({
                    lat: waypoint.lat,
                    lng: waypoint.lng
                })),
                mapInfo: {
                    center: {
                        lat: mapInfo?.center?.lat,
                        lng: mapInfo?.center?.lng
                    },
                    zoom: mapInfo?.zoom
                },
                nextStop
            });
        }
    } catch (e) {
        console.error("Error updating/creating document: ", e);
    }
}

export default syncData;

