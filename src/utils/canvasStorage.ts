import {AnyARecord} from "dns";
import localforage from "localforage";

localforage.config({
	name: "canvasApp",
	storeName: "canvasAppStorage",
	description: "try1 for the canvasApp indexDb",
	version: 1.0,
});

export interface SerializedImage {
	id: string;
	name: string;
	src: string;
	x: number;
	y: number;
	width: number;
	height: number;
	rotation?: number;
}

export interface CanvasStorageState {
	shapes: any[];
	textArray: any[];
	konvaImages: SerializedImage[];
	timestamp: number;
}

export const saveCanvasState = async (
	state: CanvasStorageState
): Promise<void> => {
	try {
		await localforage.setItem("canvasStorageState", {
			...state,
			timestamp: Date.now(),
		});
		console.log("saved stateChange to localForage");
	} catch (error) {
		console.error("error saving to canvasStorageState", error);
	}
};

export const loadCanvasState = async (): Promise<CanvasStorageState | null> => {
	try {
		const state = await localforage.getItem<CanvasStorageState>(
			"canvasStorageState"
		);
		return state;
	} catch (error) {
		console.error("error loading canvasStorageState: ", error);
		return null;
	}
};

export const clearCanvasState = async (): Promise<void> => {
	try {
		localforage.removeItem("canvasStorageState");
		console.log("localForage removed named canvasStorageState");
	} catch (error) {
		console.error("error clearing localForage ", error);
	}
};
