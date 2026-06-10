import { SignLinkClient } from "./SignLinkClient";

type Props = {
  params: { token: string };
};

export default function SignLinkPage({ params }: Props) {
  return <SignLinkClient token={params.token} />;
}
