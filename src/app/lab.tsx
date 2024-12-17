import { FileButton, Button, Group, Text, Input, Tabs } from "@mantine/core";
import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { nanoid } from "nanoid";
import { useLocalStorage } from "usehooks-ts";
import {
  ClientSideWSMessageType,
  ServerResponse,
  ServerSideWSMessageType,
  Step1ChecksJobResponse,
  Step2XRFIntensityResponse,
  Step3PredictionPayload,
  Step4X2AbundPayload,
  Step5SRPayload,
} from "../types/ws";
import base64 from "base64-encode-file";
import Visualizations from "./visualizations";
import { MoonLoader } from "react-spinners";
import Results from "./results";

function Lab() {
  const [messageHistory, setMessageHistory] = useState<MessageEvent<any>[]>([]);
  const [clientId, setClientId, removeClientId] = useLocalStorage<
    string | undefined
  >("ISRO_CLASS_CLIENT_ID", undefined);

  const [file, setFile] = useState<File | null>();
  const [enteredJobId, setEnteredJobId] = useState("");
  const [elements, setElements] = useState();
  const [jobId, setJobId] = useState("");
  const [step1, setStep1] = useState<Step1ChecksJobResponse | undefined>();
  const [step2, setStep2] = useState<Step2XRFIntensityResponse | undefined>();
  const [step3, setStep3] = useState<Step3PredictionPayload | undefined>();
  const [step4, setStep4] = useState<Step4X2AbundPayload | undefined>();
  const [step5, setStep5] = useState<Step5SRPayload | undefined>();
  const [loading, setLoading] = useState<boolean>(false);

  const handleServerMessages = (ev: MessageEvent) => {
    const serverResponse: ServerResponse = JSON.parse(ev.data);

    switch (serverResponse.type) {
      case ServerSideWSMessageType.CREATE_JOB: {
        setJobId(serverResponse.jobId);
        return;
      }

      case ServerSideWSMessageType.STEP1_CHECK_JOB: {
        if (jobId != "" && serverResponse.jobId != jobId) return;
        setStep1(serverResponse.step1ChecksJobPayload);
        return;
      }

      case ServerSideWSMessageType.STEP2_XRF_INTENSITY_JOB: {
        if (jobId != "" && serverResponse.jobId != jobId) return;
        setStep2(serverResponse.step2XRFIntensityJobPayload);
        return;
      }

      case ServerSideWSMessageType.STEP3_PREDICTION_JOB: {
        if (jobId != "" && serverResponse.jobId != jobId) return;
        setStep3(serverResponse.step3PredictionJobPayload);
        return;
      }

      case ServerSideWSMessageType.STEP4_X2_ABUND_JOB: {
        if (jobId != "" && serverResponse.jobId != jobId) return;
        setStep4(serverResponse.step4X2AbundJobPayload);
        return;
      }

      case ServerSideWSMessageType.STEP5_SR_JOB: {
        if (jobId != "" && serverResponse.jobId != jobId) return;
        setStep5(serverResponse.step5SRJobPayload);
        setLoading(false);
        return;
      }

      case ServerSideWSMessageType.CHECK_STATUS_JOB: {
        setJobId(serverResponse.jobId);
        setStep1(serverResponse.step1ChecksJobPayload);
        setStep2(serverResponse.step2XRFIntensityJobPayload);
        setStep5(serverResponse.step5SRJobPayload);
        setLoading(false);
        return;
      }
    }
  };

  const { sendJsonMessage, readyState } = useWebSocket(
    `http://${import.meta.env.VITE_APP_BACKEND_URL ?? ""}:5000`,
    {
      onMessage: handleServerMessages,
      shouldReconnect: () => true,
      reconnectAttempts: 10,
    },
  );

  const handleUpload = async () => {
    setJobId("");
    setLoading(true);
    setStep1(undefined);
    setStep2(undefined);
    setStep3(undefined);
    setStep4(undefined);
    setStep5(undefined);

    // @ts-ignore
    const fileBase64: string = await base64(file);
    sendJsonMessage({
      type: ClientSideWSMessageType.FITS_UPLOAD,
      payload: fileBase64.split(",")[1],
    });
  };

  const handleFetchResults = async () => {
    sendJsonMessage({
      type: ClientSideWSMessageType.CHECK_STATUS,
      payload: enteredJobId,
    });

    // setElements(undefined);
    // const response = await axios.get(
    //   (import.meta.env.VITE_APP_BACKEND_URL ?? "") + "/job/" + enteredJobId,
    // );

    // setElements(dummy as any);
    // if (!response.data) return;
    // setElements(response.data);
  };

  useEffect(() => {
    if (readyState == 1) {
      if (!clientId) {
        setClientId(nanoid());
      }
      sendJsonMessage({ clientId });
    }
  }, [readyState]);

  return (
    <div className="text-white mt-40 text-center flex flex-col justify-center items-center">
      <h1 className="text-5xl">Welcome to Labs!</h1>

      <p>Upload your .FITS file to process</p>

      <Tabs defaultValue="first" className="mt-10">
        <Tabs.List>
          <Tabs.Tab
            value="second"
            styles={{
              tab: {
                backgroundColor: "black",
              },
            }}
          >
            Upload
          </Tabs.Tab>
          <Tabs.Tab
            value="first"
            color="blue"
            styles={{
              tab: {
                backgroundColor: "black",
              },
            }}
          >
            Get Status
          </Tabs.Tab>
          <Tabs.Tab
            value="third"
            color="blue"
            styles={{
              tab: {
                backgroundColor: "black",
              },
            }}
          >
            Results
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="first" pt="xs">
          <div
            className="mt-10 flex-col gap-3 rounded-xl"
            style={{
              width: "400px",
            }}
          >
            <div className="flex gpa-4">
              <div
                style={{
                  width: "300px",
                }}
              >
                <Input
                  value={enteredJobId}
                  onChange={(e) => {
                    setEnteredJobId(e.target.value ?? "");
                  }}
                  placeholder="Enter the job ID"
                  width={300}
                />
              </div>
              <Button onClick={handleFetchResults}>CHECK</Button>
            </div>
          </div>
        </Tabs.Panel>

        <Tabs.Panel value="second" pt="xs">
          <div
            className="shadow-xl"
            style={{
              width: "400px",
            }}
          >
            <Group justify="center" className="mt-10">
              <FileButton onChange={(file) => setFile(file)} accept=".fits">
                {(props) => (
                  <Button {...props}>
                    {file ? "Change" : "Pick"} FITS File
                  </Button>
                )}
              </FileButton>
            </Group>

            {file && (
              <div
                className="bg-indigo-600 bg-opacity-50 p-10 rounded-md mt-10"
                style={{
                  width: "400px",
                }}
              >
                <Text size="xl" mt="sm">
                  {file.name}
                </Text>
                <div></div>

                <Button className="mt-2" onClick={handleUpload}>
                  Process
                </Button>

                {jobId != "" && (
                  <Text size="xl" mt="sm">
                    JobID : {jobId}
                  </Text>
                )}
              </div>
            )}
          </div>
        </Tabs.Panel>
        <Tabs.Panel value="third" pt="xs">
          <Results />
        </Tabs.Panel>
      </Tabs>

      <div className="flex gap-10 w-[100%] items-center justify-center">
        {jobId != "" && (
          <div className="mt-10 w-[80vw] flex flex-col justify-center items-center">
            <Visualizations
              jobID={jobId}
              step1={step1}
              step2={step2}
              step5={step5}
              step3={step3}
              step4={step4}
            />
            {loading && <MoonLoader className="my-5" color="white" />}
          </div>
        )}
      </div>
    </div>
  );
}

export default Lab;
