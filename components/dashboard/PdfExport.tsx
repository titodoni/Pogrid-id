import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

interface KpiData {
  totalPOs: number;
  totalItems: number;
  lateItems: number;
  activeItems: number;
}

const styles = StyleSheet.create({
  page: { padding: 30 },
  header: { fontSize: 20, marginBottom: 20, fontWeight: 'bold' },
  section: { margin: 10, padding: 10 },
  text: { fontSize: 12, marginBottom: 5 },
});

export const ReportDocument = ({ data }: { data: KpiData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>POGRID Report</Text>
      <View style={styles.section}>
        <Text style={styles.text}>Total POs: {data.totalPOs}</Text>
        <Text style={styles.text}>Total Items: {data.totalItems}</Text>
        <Text style={styles.text}>Late Items: {data.lateItems}</Text>
      </View>
    </Page>
  </Document>
);
