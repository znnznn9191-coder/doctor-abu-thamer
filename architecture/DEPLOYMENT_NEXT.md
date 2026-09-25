# Next Deployment Steps

## Local Deployment Status
The project is now operating as a local Node + Express + SQLite research platform.

## Recommended Next Move
The next deployment phase should keep the same backend contract while moving the server to a managed hosting platform or a container-based deployment environment.

## Suggested Path
1. Keep the backend API stable.
2. Keep the frontend served from the Express app.
3. Deploy the project behind a production-grade environment variable setup.
4. Replace the local SQLite file with a managed database strategy if needed.
5. Add CI checks for API health, smoke tests, and document validation.

## Production Considerations
- Keep backend routes and controllers stable.
- Keep no internal names or provider details in the public UI.
- Continue using academic/product language only.
- Add strict validation for research titles and source entries.
- Add audit logging and backup strategy.
- Add deployment automation for local or cloud hosting later.

## Good Fit For Future Expansion
The architecture is structured to support a simple future integration with a real provider service without forcing a front-end redesign.
