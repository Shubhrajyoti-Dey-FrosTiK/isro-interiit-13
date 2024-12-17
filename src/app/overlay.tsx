import { Abundance, Coordinate } from "../types/coord";
import Slider from "react-input-slider";
import { Button, NumberInput, Radio } from "@mantine/core";
import { Element } from "../types/element";
import { DimensionMode } from "../types/dim";
import { FormEvent, useState } from "react";
import { CameraControls } from "@react-three/drei";
import { getVector3dFromCoordinate } from "../lib/utils";

function getMapAbundance(
  abundanceMap: Map<number, Map<number, Abundance>>,
  key: string,
  lat?: number,
  lon?: number,
): string {
  if (!lat || !lon) return "-";
  let returnString = "-";
  const abundance: Abundance | undefined = abundanceMap
    .get(Math.round(lat))
    ?.get(Math.round(lon));

  // @ts-expect-error Type error
  if (abundance && abundance[key] != "NaN") returnString = abundance[key] + "%";

  return returnString;
}

function Overlay({
  scale,
  setScale,
  abundanceMap,
  elementToPlot,
  setElementToPlot,
  dimensionMode,
  setDimensionMode,
  hoveredCoordinates,
  cameraControlsRef,
  setHoveredCoordinates,
}: {
  dimensionMode: DimensionMode;
  setDimensionMode: (dim: DimensionMode) => void;
  scale: number;
  elementToPlot: Element;
  setElementToPlot: (element: Element) => void;
  abundanceMap: Map<number, Map<number, Abundance>>;
  setScale: (scale: number) => void;
  hoveredCoordinates?: Coordinate;
  setHoveredCoordinates: (coord: Coordinate) => void;
  cameraControlsRef: React.MutableRefObject<CameraControls | null>;
}) {
  const [goToCoordinates, setGoToCoordinates] = useState<Coordinate | null>();

  const handleGoToCoordinate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const point = getVector3dFromCoordinate(goToCoordinates as any, 4);
    setHoveredCoordinates(goToCoordinates ?? { lat: 0, lon: 0 });
    cameraControlsRef.current?.setPosition(point.x, point.y, point.z, true);
  };

  return (
    <div>
      {/* LAT LON */}
      {hoveredCoordinates && dimensionMode != DimensionMode.LAB && (
        <div
          className="fixed text-white bottom-0 right-0 m-5 bg-black px-5 py-2"
          style={{
            bottom: "0px",
          }}
        >
          LAT: {hoveredCoordinates?.lat.toPrecision(4)} | LON:{" "}
          {hoveredCoordinates?.lon.toPrecision(4)}
        </div>
      )}

      {/* ZOOM IN/OUT */}
      {dimensionMode == DimensionMode.TwoDimension && (
        <div className="fixed top-[30%] m-5 bg-black gap-5 px-5 py-5 text-white rounded-md flex flex-col justify-center">
          <div
            className="cursor-pointer"
            onClick={() => setScale(Math.min(scale + 0.1, 1))}
          >
            +
          </div>
          <Slider
            y={scale}
            axis="y"
            yreverse
            ymin={0.2}
            ymax={1}
            ystep={0.01}
            onChange={({ y }) => {
              setScale(y);
            }}
          />
          <div
            className="cursor-pointer"
            onClick={() => setScale(Math.max(scale - 0.1, 0.5))}
          >
            -
          </div>
        </div>
      )}

      {/* ABUNDANCE COUNT */}
      {dimensionMode != DimensionMode.LAB && (
        <div className="fixed text-white top-0 right-0 m-5 flex gap-4 ">
          {/* {hoveredCoordinates && (
            <div className="bg-black rounded-md  px-5 py-2">
              Al:{" "}
              {getMapAbundance(
                abundanceMap,
                "al",
                hoveredCoordinates?.lat,
                hoveredCoordinates?.lon,
              )}
              , Si:{" "}
              {getMapAbundance(
                abundanceMap,
                "si",
                hoveredCoordinates?.lat,
                hoveredCoordinates?.lon,
              )}
              , Mg:{" "}
              {getMapAbundance(
                abundanceMap,
                "mg",
                hoveredCoordinates?.lat,
                hoveredCoordinates?.lon,
              )}
              , Fe:{" "}
              {getMapAbundance(
                abundanceMap,
                "fe",
                hoveredCoordinates?.lat,
                hoveredCoordinates?.lon,
              )}
              , O: 45%
            </div>
          )} */}
          {/* @ts-expect-err Not a JSX component error */}
          <a
            className="bg-black rounded-md  px-5 py-2  flex gap-2"
            href="/ISRO.fibnacci_lat_lon_v2.bak.zip"
            target="_blank"
          >
            Download
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              className="icon icon-tabler icons-tabler-outline icon-tabler-download"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />
              <path d="M7 11l5 5l5 -5" />
              <path d="M12 4l0 12" />
            </svg>
          </a>
        </div>
      )}

      {/* ELEMENT TO PLOT */}
      {dimensionMode != DimensionMode.LAB && (
        <div className="fixed text-white top-0 bg-black m-5 p-5 rounded-md">
          <Radio.Group
            value={elementToPlot}
            onChange={(val) => setElementToPlot(val as Element)}
            label="Select the element to map"
          >
            {Object.entries(Element).map(([key, el]) => (
              <Radio value={el} label={key} className="my-1" />
            ))}
          </Radio.Group>
        </div>
      )}

      {/* DIMENSION SELECTION */}
      <div className="fixed text-white top-0 right-[40%] bg-black m-5 p-2 flex gap-5 rounded-md text-2xl rounded-sm">
        <div
          className={`px-3 cursor-pointer ${dimensionMode == DimensionMode.TwoDimension && "bg-gray-800"}`}
          onClick={() => setDimensionMode(DimensionMode.TwoDimension)}
        >
          2D
        </div>
        <div
          className={`px-3 cursor-pointer ${dimensionMode == DimensionMode.ThreeDimension && "bg-gray-800"}`}
          onClick={() => setDimensionMode(DimensionMode.ThreeDimension)}
        >
          3D
        </div>
        <div
          className={`px-3 cursor-pointer ${dimensionMode == DimensionMode.LAB && "bg-gray-800"}`}
          onClick={() => setDimensionMode(DimensionMode.LAB)}
        >
          Lab
        </div>
      </div>

      {dimensionMode == DimensionMode.ThreeDimension && (
        <form
          onSubmit={handleGoToCoordinate}
          className="fixed flex items-center gap-2 text-white bottom-0 left-0 m-5 flex gap-4 bg-black px-5 rounded-md py-2"
        >
          Lat:
          <NumberInput
            className="w-20"
            rightSection={<></>}
            styles={{
              input: {
                backgroundColor: "black",
                color: "white",
              },
            }}
            stepHoldInterval={100}
            max={90}
            min={-90}
            onChange={(val) =>
              setGoToCoordinates({
                lon: goToCoordinates?.lon ?? 0,
                lat: Number(val),
              })
            }
            value={goToCoordinates?.lat}
          />
          Lon:
          <NumberInput
            className="w-20"
            rightSection={<></>}
            styles={{
              input: {
                backgroundColor: "black",
                color: "white",
              },
            }}
            max={180}
            min={-180}
            stepHoldInterval={100}
            onChange={(val) =>
              setGoToCoordinates({
                lat: goToCoordinates?.lat ?? 0,
                lon: Number(val),
              })
            }
            value={goToCoordinates?.lon}
          />
          <Button type="submit">GO</Button>
        </form>
      )}
    </div>
  );
}

export default Overlay;
