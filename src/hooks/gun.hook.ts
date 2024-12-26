import { useEffect, useState } from "react";
import { user } from "../services/gun";
import { sharedLocations } from "../services/gun/config";
import { Location } from "../types/gun";

export const useUserLocationsId = () => {
    const [locationIds, setLocationIds] = useState(new Set<string>());
    useEffect(() => {
        user.get('locations').map().on((locationId: string) => {
            setLocationIds(prev => new Set([...prev, locationId]));
        });

        return () => {
            user.get('locations').map().off();
        };
    }, []);

    return locationIds;
}

export const useLocationList = () => {
    const locationIds = useUserLocationsId();
    const [locationList, setLocationList] = useState<Location[]>([]);
    const [locationIdsFetched, setLocationIdsFetched] = useState<string[]>([]);

    useEffect(() => {
        locationIds.forEach(locationId => {
            if (locationIdsFetched.includes(locationId)) return;
            setLocationIdsFetched(prev => [...prev, locationId]);
            console.log("locationId", locationId);
            sharedLocations.get(locationId).on((data: Omit<Location, 'id'> | null) => {
                console.log("data", data);
                if (data) {
                    const locationWithId: Location = { ...data, id: locationId };
                    setLocationList((prev) => {
                        const filtered = prev.filter((loc) => loc.id !== locationId);
                        return [...filtered, locationWithId];
                    });
                }
            });
        });
    }, [locationIds, locationIdsFetched]);

    return { locationIds, locationList };
};
