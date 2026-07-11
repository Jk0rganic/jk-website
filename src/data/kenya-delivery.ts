export type DeliverySubtype = "door_to_door" | "parcel_office";

export type ParcelOffice = {
  id: string;
  name: string;
  address: string;
};

export type ParcelTown = {
  name: string;
  offices: ParcelOffice[];
};

export type ParcelCounty = {
  county: string;
  towns: ParcelTown[];
};

/** Counties that receive door-to-door delivery. */
export const DOOR_TO_DOOR_COUNTIES = ["Nairobi"] as const;

export const KENYA_COUNTIES = [
  "Baringo",
  "Bomet",
  "Bungoma",
  "Busia",
  "Elgeyo-Marakwet",
  "Embu",
  "Garissa",
  "Homa Bay",
  "Isiolo",
  "Kajiado",
  "Kakamega",
  "Kericho",
  "Kiambu",
  "Kilifi",
  "Kirinyaga",
  "Kisii",
  "Kisumu",
  "Kitui",
  "Kwale",
  "Laikipia",
  "Lamu",
  "Machakos",
  "Makueni",
  "Mandera",
  "Marsabit",
  "Meru",
  "Migori",
  "Mombasa",
  "Murang'a",
  "Nairobi",
  "Nakuru",
  "Nandi",
  "Narok",
  "Nyamira",
  "Nyandarua",
  "Nyeri",
  "Samburu",
  "Siaya",
  "Taita Taveta",
  "Tana River",
  "Tharaka Nithi",
  "Trans Nzoia",
  "Turkana",
  "Uasin Gishu",
  "Vihiga",
  "Wajir",
  "West Pokot",
] as const;

export type KenyaCounty = (typeof KENYA_COUNTIES)[number];

export function isDoorToDoorCounty(county: string): boolean {
  return DOOR_TO_DOOR_COUNTIES.includes(
    county as (typeof DOOR_TO_DOOR_COUNTIES)[number],
  );
}

export function getDeliverySubtype(county: string): DeliverySubtype {
  return isDoorToDoorCounty(county) ? "door_to_door" : "parcel_office";
}

function countySlug(county: string): string {
  return county.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

/**
 * Parcel offices grouped by county and town/stage.
 * Counties not listed here fall back to a generic nearest-stage option.
 */
export const PARCEL_OFFICES_BY_COUNTY: ParcelCounty[] = [
  {
    county: "Kiambu",
    towns: [
      { name: "Kiambu Town", offices: [] },
      { name: "Thika", offices: [] },
      { name: "Ruiru", offices: [] },
      { name: "Juja", offices: [] },
      { name: "Limuru", offices: [] },
      { name: "Kikuyu", offices: [] },
      { name: "Githunguri", offices: [] },
      { name: "Gatundu", offices: [] },
      { name: "Lari", offices: [] },
      { name: "Kimende", offices: [] },
      { name: "Banana", offices: [] },
      { name: "Wangige", offices: [] },
      { name: "Ruaka", offices: [] },
      { name: "Kiambaa", offices: [] },
    ],
  },
  {
    county: "Mombasa",
    towns: [
      {
        name: "Mombasa Island",
        offices: [
          {
            id: "mombasa_fargo_nkrumah",
            name: "Fargo Courier – Nkrumah Road",
            address: "Nkrumah Road, Mombasa",
          },
          {
            id: "mombasa_stage_makadara",
            name: "Makadara Stage Parcel Desk",
            address: "Makadara, Mombasa",
          },
        ],
      },
      {
        name: "Nyali",
        offices: [
          {
            id: "mombasa_g4s_nyali",
            name: "G4S Courier – Nyali",
            address: "Links Road, Nyali, Mombasa",
          },
        ],
      },
    ],
  },
  {
    county: "Kisumu",
    towns: [
      {
        name: "Kisumu City",
        offices: [
          {
            id: "kisumu_fargo_ogon",
            name: "Fargo Courier – Oginga Odinga St",
            address: "Oginga Odinga Street, Kisumu",
          },
          {
            id: "kisumu_stage_kondele",
            name: "Kondele Stage Parcel Desk",
            address: "Kondele, Kisumu",
          },
        ],
      },
    ],
  },
  {
    county: "Nakuru",
    towns: [
      {
        name: "Nakuru Town",
        offices: [
          {
            id: "nakuru_fargo_kenyatta",
            name: "Fargo Courier – Kenyatta Avenue",
            address: "Kenyatta Avenue, Nakuru",
          },
          {
            id: "nakuru_stage_main",
            name: "Nakuru Main Stage Parcel Desk",
            address: "Main Stage, Nakuru",
          },
        ],
      },
    ],
  },
  {
    county: "Uasin Gishu",
    towns: [
      {
        name: "Eldoret Town",
        offices: [
          {
            id: "eldoret_fargo_kenyatta",
            name: "Fargo Courier – Kenyatta Street",
            address: "Kenyatta Street, Eldoret",
          },
          {
            id: "eldoret_stage_main",
            name: "Eldoret Stage Parcel Desk",
            address: "Main Stage, Eldoret",
          },
        ],
      },
    ],
  },
  {
    county: "Nyeri",
    towns: [
      {
        name: "Nyeri Town",
        offices: [
          {
            id: "nyeri_fargo_kimathi",
            name: "Fargo Courier – Kimathi Way",
            address: "Kimathi Way, Nyeri",
          },
        ],
      },
    ],
  },
  {
    county: "Meru",
    towns: [
      {
        name: "Meru Town",
        offices: [
          {
            id: "meru_stage_main",
            name: "Meru Main Stage Parcel Desk",
            address: "Main Stage, Meru",
          },
        ],
      },
    ],
  },
  {
    county: "Kakamega",
    towns: [
      {
        name: "Kakamega Town",
        offices: [
          {
            id: "kakamega_fargo_main",
            name: "Fargo Courier – Kakamega",
            address: "Kakamega Town Centre",
          },
        ],
      },
    ],
  },
  {
    county: "Kisii",
    towns: [
      {
        name: "Kisii Town",
        offices: [
          {
            id: "kisii_stage_main",
            name: "Kisii Stage Parcel Desk",
            address: "Main Stage, Kisii",
          },
        ],
      },
    ],
  },
];

export function getParcelCountyData(county: string): ParcelCounty | undefined {
  return PARCEL_OFFICES_BY_COUNTY.find((entry) => entry.county === county);
}

export function getParcelTownsForCounty(county: string): ParcelTown[] {
  const data = getParcelCountyData(county);
  if (data?.towns.length) return data.towns;

  return [
    {
      name: `${county} Town`,
      offices: [
        {
          id: `${countySlug(county)}_main_stage`,
          name: `${county} Nearest Stage / Parcel Office`,
          address: `Nearest parcel office or stage in ${county}`,
        },
      ],
    },
  ];
}

export function getParcelTownNamesForCounty(county: string): string[] {
  return getParcelTownsForCounty(county).map((town) => town.name);
}

export function findParcelOffice(
  county: string,
  officeId: string,
): { office: ParcelOffice; town: string } | undefined {
  for (const town of getParcelTownsForCounty(county)) {
    const office = town.offices.find((o) => o.id === officeId);
    if (office) return { office, town: town.name };
  }
  return undefined;
}
