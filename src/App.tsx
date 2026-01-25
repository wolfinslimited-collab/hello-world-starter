// Application entry point - v3
import { LangLoader } from "components/common/language";
import { lazy, Suspense, useEffect } from "react";
import PreLoading from "components/layouts/pre-loading";
import Header from "components/specific/header";
import Loader from "components/common/loader";
import Footer from "components/specific/footer";
import { Web3Provider } from "components/web3/web3-provider";
import useStorage from "context";
import ChatWidget from "components/chat";
const Pages = lazy(() => import("pages"));

function App() {
  const { setSetting } = useStorage();
  useEffect(() => {
    window.addEventListener("message", (event) => {
      if (event?.data?.login) {
        setSetting(null);
      }
    });
  }, []);

  return (
    <Web3Provider>
      <div className="relative w-full pb-6">
        <Suspense
          fallback={
            <div className="h-screen">
              <PreLoading />
            </div>
          }
        >
          <ChatWidget />
          <LangLoader />
          <Header />
          <Loader>
            <Pages />
          </Loader>
          <Footer />
        </Suspense>
      </div>
    </Web3Provider>
  );
}

export default App;
