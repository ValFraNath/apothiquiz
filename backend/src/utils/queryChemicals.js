import axios from "axios";

/**
 * Get chemicals higher systems
 *
 */
export async function getChemicalSystems() {
  const { data: result } = await axios.get("/api/v1/chemicals/systems");

  const systems = result.reduce(
    (acc, value) => {
      acc[value.sy_id] = value.sy_name;
      return acc;
    },
    { null: "Tout" }
  );
  return systems;
}
