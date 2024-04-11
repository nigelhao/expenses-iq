// Custom styles for the Configurator
import ConfiguratorRoot from "layouts/Configurator/ConfiguratorRoot";

// Soft UI Dashboard PRO React context
import { useSoftUIController } from "context";

function Configurator() {
  const [controller] = useSoftUIController();
  const { openConfigurator } = controller;

  return (
    <ConfiguratorRoot variant="permanent" ownerState={{ openConfigurator }}></ConfiguratorRoot>
  );
}

export default Configurator;
