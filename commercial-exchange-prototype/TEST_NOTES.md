# Prototype test notes

Initial local test on 2026-08-11 found two issues:

1. Leaflet CDN CSS and JavaScript resources were blocked because the integrity attributes did not match the delivered files. The page therefore cannot initialize the map reliably until those integrity values are removed or corrected.
2. The prototype displayed only illustrative partner records and showed zero Vanguard-source records. The current `listings.json` schema needs inspection so the source adapter can normalize its top-level structure correctly.

No existing site page or asset was modified during this test. All work is contained within `commercial-exchange-prototype/`.

## Successful retest

After updating the source adapter and Leaflet resource references, the page loaded successfully at the local prototype route. The interface showed 13 records: 9 from the existing Vanguard local source and 4 clearly marked illustrative partner-feed records. The Leaflet map rendered with the source-aware markers and the Kammerer Industrial Park card successfully opened its detailed modal, including its source note and original-listing link.

The prototype remains isolated in `commercial-exchange-prototype/`; no existing production page, navigation item, listing renderer, or shared asset was modified.

The sale-only quick filter was also tested successfully. It reduced the prototype from 13 records to 7 sale opportunities, including 5 Vanguard-source records and 2 illustrative partner records, and refreshed the map markers accordingly.

The prototype inquiry form was tested with representative values. It cleared the sample data after submission and returned its intended non-production confirmation message. It does not send email or submit a live lead.
