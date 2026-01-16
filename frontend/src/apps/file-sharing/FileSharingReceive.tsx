import { ShareReceiver } from "./components/ShareReceiver"

/**
 * Separate component for the receive route to avoid routing conflicts
 */
export function FileSharingReceive() {
  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-6">
      <ShareReceiver />
    </div>
  )
}
