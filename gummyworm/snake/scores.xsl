<?xml version="1.0" encoding="ISO-8859-1"?>

<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:template match="/">

	<html>
		<body style="text-alignment: center; width: 100%;" background="gummyworms.jpg">
			<style>
				table {
					left: 10%;
					top: 100px;
				}
			</style>
			<h1><font stule="Arial" color="#000000" size="25pt">Gummy Worm All Scores</font></h1>
			<table border="1">
				<tr bgcolor="#000000">
					<th><font color="#FFFFFF" size="12pt">#</font></th>
					<th><font color="#FFFFFF" size="12pt">Name</font></th>
					<th><font color="#FFFFFF" size="12pt">Score</font></th>
					<th><font color="#FFFFFF" size="12pt">Apples</font></th>
					<th><font color="#FFFFFF" size="12pt">Blueberries</font></th>
				</tr>
				<xsl:for-each select="scores/record">
					<tr bgcolor="#000000">
						<td><font color="#FFFFFF" size="6pt"><xsl:value-of select="position()"/></font></td>
						<td><font color="#FFFFFF" size="6pt"><xsl:value-of select="name"/></font></td>
						<td><font color="#FFFFFF" size="6pt"><xsl:value-of select="score"/></font></td>
						<td><font color="#FFFFFF" size="6pt"><xsl:value-of select="apple"/></font></td>
						<td><font color="#FFFFFF" size="6pt"><xsl:value-of select="blueberry"/></font></td>
					</tr>
				</xsl:for-each>
			</table>
		</body>
	</html>
</xsl:template>
</xsl:stylesheet>
