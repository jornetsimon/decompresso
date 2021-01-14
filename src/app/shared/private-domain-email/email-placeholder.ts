export function generateEmailPlaceholder() {
	const mailbox = randomItemFromArray(firstnamePool).toLowerCase();
	const domain = randomItemFromArray(domainPool).toLowerCase();
	return `${mailbox}@${domain}`;
}
function randomItemFromArray<T>(arr: ReadonlyArray<T>): T {
	return arr[Math.floor(Math.random() * arr.length)];
}
const firstnamePool: ReadonlyArray<string> = [
	'Camille',
	'Louise',
	'Lea',
	'Ambre',
	'Agathe',
	'Jade',
	'Julia',
	'Mila',
	'Alice',
	'Chloe',
	'Emma',
	'Andrea',
	'Anna',
	'Lucie',
	'Eden',
	'Romane',
	'Elise',
	'Lola',
	'Zoe',
	'Emy',
	'Leonie',
	'Mia',
	'Rose',
	'Candice',
	'Amelia',
	'Maelys',
	'Clemence',
	'Elena',
	'Manon',
	'Thais',
	'Valentine',
	'Eva',
	'Jeanne',
	'Lena',
	'Louna',
	'Charlotte',
	'Clara',
	'Constance',
	'Iris',
	'Lise',
	'Lou',
	'Mathilde',
	'Olivia',
	'Ines',
	'Adele',
	'Alicia',
	'Angelina',
	'Apolline',
	'Capucine',
	'Louis',
	'Gabriel',
	'Leo',
	'Mael',
	'Paul',
	'Hugo',
	'Valentin',
	'Gabin',
	'Arthur',
	'Theo',
	'Jules',
	'Lucas',
	'Sacha',
	'Ethan',
	'Timeo',
	'Antoine',
	'Nathan',
	'Raphael',
	'Thomas',
	'Tom',
	'Matheo',
	'Mathis',
	'Samuel',
	'Tiago',
	'Baptiste',
	'Eliott',
	'Maxime',
	'Nolan',
	'Malo',
	'Aaron',
	'Marius',
	'Antonin',
	'Diego',
	'Leon',
	'Robin',
	'Simon',
	'Adam',
	'Axel',
	'Gaspard',
	'Martin',
	'Milo',
	'Nael',
	'Noe',
	'Mahe',
	'Mathys',
	'Titouan',
	'Achille',
	'Augustin',
	'Liam',
];
const domainPool: ReadonlyArray<string> = [
	'carrefour.fr',
	'univ-nantes.fr',
	'sncf.com',
	'renault.fr',
	'unicef.fr',
	'apple.com',
	'danone.fr',
	'sanofi.fr',
	'apec.fr',
	'airfrance.fr',
	'loreal.com',
	'decathlon.fr',
	'ac-rennes.fr',
	'ubisoft.com',
	'ratp.fr',
	'total.fr',
];
