import axios from "axios";

export async function urlToBlob(url: string, fileName: string): Promise<File> {
  const response = await axios.get(url, { responseType: "blob" });

  const blob = await response.data;

  const file = new File([blob], fileName, { type: blob.type });

  return file;
}
