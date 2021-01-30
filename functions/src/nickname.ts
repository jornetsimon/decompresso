import { db } from './init';
import { Endpoints } from './index';
import { addHours, isAfter } from 'date-fns';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import FieldValue = admin.firestore.FieldValue;

/**
 * Picks a random user nickname from a room pool
 * It will then remove it from the pool to maintain uniqueness
 * @param domain The domain of the room to pick the nickname from
 */
export async function pickNickname(domain: string) {
	const docRef = db.doc(`${Endpoints.Rooms}/${domain}`);

	return db.runTransaction(async (transaction) => {
		const documentSnap = await transaction.get(docRef);
		const documentData = documentSnap.data();
		if (!documentData) {
			throw new Error('no_data_in_document');
		}
		const pool: ReadonlyArray<string> | undefined = documentData.nickname_pool;
		if (!pool?.length) {
			throw new Error('no_available_nickname');
		}
		const nickname = pool[0];
		transaction.update(docRef, {
			nickname_pool: FieldValue.arrayRemove(nickname),
		});
		return nickname;
	});
}

/**
 * Gets a random slice of the nickname pool from the user's room
 */
export const getNicknamesSample = functions.https.onCall(async (data, context) => {
	if (!(context.auth && context.auth.token.email_verified)) {
		throw new functions.https.HttpsError('failed-precondition', 'not_authenticated');
	}
	const domain = context.auth.token.domain;
	const roomSnap = await db.doc(`${Endpoints.Rooms}/${domain}`).get();
	const roomData = roomSnap.data();
	if (!roomData) {
		throw new Error('no_room_data');
	}
	const pool: ReadonlyArray<string> | undefined = roomData.nickname_pool;
	if (!pool?.length) {
		throw new Error('no_available_nickname');
	}
	return shuffleArray(pool).slice(0, data.count);
});

/**
 * Changes the nickname of a user by another
 * Puts back the previous nickname in the pool
 */
export const changeNickname = functions.https.onCall(async (data, context) => {
	// User
	const uid = context.auth?.uid;
	if (!(uid && context.auth?.token.email_verified)) {
		throw new functions.https.HttpsError('failed-precondition', 'not_authenticated');
	}
	const userRef = db.doc(`${Endpoints.Users}/${uid}`);
	const userData = (await userRef.get()).data();
	const domain = userData?.domain;
	if (!domain) {
		throw new functions.https.HttpsError('failed-precondition', 'domain_undefined');
	}
	const userCreationDate = userData ? new Date(userData.createdAt.seconds * 1000) : undefined;
	if (!userCreationDate || isAfter(userCreationDate, addHours(Date.now(), 1))) {
		// If this function is called shortly after the account creation, deny
		throw new functions.https.HttpsError('failed-precondition', 'creation_date_too_old');
	}
	const currentNickname = userData?.nickname;
	const nickname = data.nickname;
	if (!nickname) {
		throw new functions.https.HttpsError('failed-precondition', 'nickname_not_specified');
	}

	// Room
	const roomRef = db.doc(`${Endpoints.Rooms}/${domain}`);
	const roomSnap = await roomRef.get();
	const roomData = roomSnap.data();
	const pool: ReadonlyArray<string> | undefined = roomData?.nickname_pool;
	const nicknameAvailable = !!pool?.includes(nickname);
	if (!nicknameAvailable) {
		throw new functions.https.HttpsError('failed-precondition', 'nickname_unavailable');
	}
	const memberRef = db.doc(`${Endpoints.Rooms}/${domain}/${Endpoints.RoomMembers}/${uid}`);

	// Updates
	return Promise.all([
		// Put the previous username back in the pool
		roomRef.update({
			nickname_pool: FieldValue.arrayUnion(currentNickname),
		}),
		// Pick the new nickname from the pool
		roomRef.update({
			nickname_pool: FieldValue.arrayRemove(nickname),
		}),
		// Set the username in the user
		userRef.update({
			nickname,
		}),
		// Set the username in the member
		memberRef.update({
			nickname,
		}),
	]).then(() => {
		return nickname;
	});
});

export const nicknamePool: ReadonlyArray<string> = [
	'PandaEpuisé',
	'BrebisEgarée',
	'ChaiseBancale',
	'MargueriteEpanouie',
	'FidèleCastor',
	'JambonFumé',
	'ChameauAssoiffé',
	'LutinGrincheux',
	'ChatMyope',
	'ChienFarceur',
	'PoussinIndiscret',
	'RatTeufeur',
	'SerpentEnchanteur',
	'EcureuilEbouriffé',
	'BaleineÉchouée',
	'OrqueEdenté',
	'PhasmeExpress',
	'LionAsthmatique',
	'PolochonBlagueur',
	'CouetteCoquette',
	'GiraffeNaine',
	'PetitPoney',
	'ClaironPapoteur',
	'HyèneEtourdie',
	'SpeedyParesseu',
	'LoupBedonnant',
	'TaupeVoyeuse',
	'PiedPalmé',
	'PoulettePlumée',
	'BiquetteCornue',
	'MoutonFrisé',
	'TasseFélée',
	'FrigoArdent',
	'FourGrelottant',
	'LapinFrigorifié',
	'CanardLaqué',
	'RequinGateux',
	'VerPoilu',
	'AneBabacool',
	'CrocoVegan',
	'PoeleBondissante',
	'OeufPoché',
	'ThéièreEnrhumée',
	'PatateDodue',
	'PotironFlasque',
	'TomateJouflue',
	'AspergeEtendue',
	'OuieSélective',
	'DindonInerte',
	'RadisMieleux',
	'SavonFou',
	'BalaiImberbe',
	'RatMasqué',
	'RatonBuveur',
	'CarpeEloquante',
	'CanardBoiteux',
	'LinotteErudite',
	'GardonDéfraichi',
	'ChaussetteTrouée',
	'ManteauImbibé',
	'ShortSvelte',
	'PullDentelé',
	'ChemiseMouchetée',
	'SlipMoustachu',
	'PanierPercé',
	'SphinxMoumouté',
	'AspiRaleur',
	'SpatuleCramée',
	'LoucheDébordante',
	'PlumeauFané',
	'MicroIntroverti',
	'MarteauGuimauve',
	'PinceDétendue',
	'ScieEdentée',
	'ClouTordu',
	'LimeAEau',
	'MeuleuseEngourdie',
	'TarteFluette',
	'PotAuFouin',
	'QuicheLointaine',
	'PouletBasket',
	'FondueSavante',
	'BoeufBourguigui',
	'CoqAuGrain',
	'HachisParmenpied',
	'SteackDareDare',
	'ChouGloute',
	'TartePatin',
	'IlesFloutantes',
	'BananaSlip',
	'BabaAuRime',
	'CrèmeBranée',
	'PainRetrouvé',
	'FarPietton',
	'PateAPetrin',
	'BoeufPopote',
	'NemQuiRit',
	'NouillePapotée',
	'BrochettePépette',
	'RizCancané',
	'RouleauPlanplan',
	'BurgerRing',
	'PizzaChut',
	'BriocheBrulée',
	'BuffaloVrille',
	'ReblochonChon',
	'BrieDeMot',
	'CamenBèbère',
	'RoqueFour',
	'PetitSuisse',
	'GruyèreLisse',
	'MascarPoney',
	'MimoLinette',
	'FélicieAussi',
	'CouscousMarmite',
	'DiscoFerveur',
	'FoxTrotte',
	'RaggaThon',
	'FrenchPanpan',
	'BigBisous',
	'GinTropVite',
	'RoséPimousse',
	'GetVinSet',
	'SaintMimilion',
	'BeaujolaisRétro',
	'PetitChignon',
	'AperoBic',
	'BaliBalo',
	'SmellLikeFlower',
	'MarcoPolo',
	'JonSnow',
	'PetitPatapon',
	'MitchBuchannon',
	'SoupapeTitubante',
	'SourisCurieuse',
	'CafetièreFuyante',
	'PoissonFrit',
	'ChanteurMasqué',
	'RimePotache',
	'GrandPonton',
	'LanguePendue',
	'CaféFrappé',
	'EscalopePannée',
	'CarotteRigolote',
	'CabinetLuxueux',
	'ChenilleOndulée',
	'PotDeFleur',
	'JeanBon',
	'RhinoFéroce',
	'CoteDeBluff',
	'MarteauPiquant',
	'BoîteEnfoncée',
	'SilenceRadio',
	'MerlinPinpin',
	'GlorieuseLicorne',
	'ConcombreFlétri',
	'PétaleSolitaire',
	'BlocMotte',
	'CoussinPrêteur',
	'GuirlandeNormande',
	'BlouseTachée',
	'TomateVolante',
	'ArcEnMiel',
	'CitronPressé',
	'RomanScié',
	'MultiPass',
	'KorbenDallas',
	'JohnnyUtah',
	'RubyRhod',
	'SacAPoutres',
	'RogerRabbit',
	'PresseClapier',
	'TapisDémodé',
	'ChatBotté',
	'PommeDePin',
	'PoissonÉpargné',
	'AstroTaupe',
	'JeanTroué',
	'GéantVert',
	'PetitGouda',
	'InspecteurDerrick',
];

export function shuffleArray(inputArray) {
	// tslint:disable-next-line:readonly-array
	const array = [...inputArray];
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}
