import React, { useEffect, useState } from 'react';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ParamListBase} from '@react-navigation/native';
import {View, Text, TextStyle} from 'react-native';
import {Button, Header, Icon} from '@rneui/themed';
import {styles} from '../form-screen/styles';
import {ViewStyle} from 'react-native';
import {spacing} from '../../theme/spacing';
import {palette} from '../../theme/palette';
import {fontStyles} from '../../theme/font';
import { getSiteVisitsByField } from '../../models/site_visit/site_visit.store';
import { getSassSiteVisitByField } from '../../models/sass/sass.store';
import { getSitesByField } from '../../models/site/site.store';
import Site from '../../models/site/site';
import SiteVisit from '../../models/site_visit/site_visit';

export interface UnsyncedScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase>;
}

interface UnsyncedInterface {
  id: number | undefined;
  type: 'site' | 'sass' | 'site_visit';
  name: string;
  desc?: string;
  created: Date;
}

interface UnsyncedItemInterface extends UnsyncedInterface {
  onClickEdit: Function;
  onClickRemove: Function;
  loading: boolean;
}

const ITEM_CONTAINER: ViewStyle = {
  padding: spacing[3],
  borderBottomColor: '#00000030',
  borderBottomWidth: 1,
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
};

const TITLE_STYLE: TextStyle = {
  fontWeight: 'bold',
  ...fontStyles.large,
};

const SUBTITLE_STYLE: TextStyle = {
  ...fontStyles.medium,
};

const ITEM_CONTENT: ViewStyle = {
  width: '70%',
  paddingRight: spacing[3],
};

const ACTION_BUTTON: ViewStyle = {
  width: 50,
  height: 50,
  marginRight: 10,
};

function UnsyncedItem(props: UnsyncedItemInterface) {
  useEffect(() => {
    console.log(props);
  }, [props]);

  return (
    <View style={ITEM_CONTAINER}>
      <View style={ITEM_CONTENT}>
        <Text style={TITLE_STYLE}>{props.name}</Text>
        <Text style={SUBTITLE_STYLE}>
          {props.created ? props.created?.toDateString() : '-'}
        </Text>
        <Text style={SUBTITLE_STYLE}>{props.desc}</Text>
      </View>
      <Button
        disabled={props.loading}
        buttonStyle={{...ACTION_BUTTON, backgroundColor: palette.angry}}
        onPress={e => props.onClickRemove(props.id, props.type)}>
        <Icon
          name="trash"
          color={palette.white}
          type="font-awesome"
          size={25}
        />
      </Button>
      <Button
        buttonStyle={ACTION_BUTTON}
        disabled={props.loading}
        onPress={e => props.onClickEdit(props.id, props.type)}>
        <Icon
          name="pencil"
          color={palette.white}
          type="font-awesome"
          size={25}
        />
      </Button>
    </View>
  );
}

export const UnsyncedScreen: React.FunctionComponent<
  UnsyncedScreenProps
> = props => {
  // @ts-ignore
  const {route} = props;
  const [unsynced, setUnsynced] = useState<UnsyncedInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const parseSiteDesc = (siteData: Site) => {
    const siteCode = siteData.siteCode
      ? 'Site Code : ' + siteData.siteCode + '\n'
      : '';
    return siteCode + 'Site Desc : ' + siteData.description;
  };

  const parseSiteVisitDesc = (siteVisit: SiteVisit) => {
    const locationSite = siteVisit.site.siteCode
      ? siteVisit.site.siteCode
      : siteVisit.site.description;
    return 'Location Site : ' + locationSite;
  };

  const getUnsyncedData = async () => {
    setLoading(true);
    const _unsynced: UnsyncedInterface[] = [];
    const unsyncedSites = (await getSitesByField('synced', false)) || [];
    const unsyncedSiteVisits =
      (await getSiteVisitsByField('synced', false)) || [];
    const unsyncedSass = (await getSassSiteVisitByField('synced', false)) || [];
    for (const unsyncedSite of unsyncedSites) {
      _unsynced.push({
        id: unsyncedSite.id,
        name: 'Location Site',
        desc: parseSiteDesc(unsyncedSite),
        type: 'site',
        created: new Date(unsyncedSite.datetime * 1000),
      });
    }
    for (const unsyncedSiteVisit of unsyncedSiteVisits) {
      _unsynced.push({
        id: unsyncedSiteVisit.id,
        name: 'Site Visit',
        desc: parseSiteVisitDesc(unsyncedSiteVisit),
        created: new Date(unsyncedSiteVisit.date),
        type: 'site_visit',
      });
    }
    setUnsynced(
      _unsynced.sort((a, b) => a.created.getTime() - b.created.getTime()),
    );
    setLoading(false);
  };

  useEffect(() => {
    getUnsyncedData();
  }, []);

  const handleClickEdit = (_id: number, _type: string) => {
    const _unsynced = unsynced.find(
      ({id, type}) => id === _id && type === _type,
    );
    if (_type === 'site') {
      props.navigation.navigate('siteForm', {
        siteId: _id,
        editMode: true,
        onBackToMap: async (newSiteId: Number | null = null) => {
          getUnsyncedData();
          return;
        },
      });
    } else if (_type === 'site_visit') {
      props.navigation.navigate('OccurrenceForm', {
        siteVisitId: _id,
      });
    }
  };

  const handleClickRemove = (_id: number, _type: string) => {
    const _unsynced = unsynced.find(
      ({id, type}) => id === _id && type === _type,
    );
  };

  return (
    <View>
      <Header
        placement="center"
        leftComponent={{
          icon: 'chevron-left',
          type: 'font-awesome',
          color: '#fff',
          onPress: () => props.navigation.goBack(),
        }}
        centerComponent={{
          text: 'Unsynced Data',
          style: {fontSize: 18, color: '#fff', fontWeight: 'bold'},
        }}
        containerStyle={styles.HEADER_CONTAINER}
      />
      {unsynced.map((_unsynced: UnsyncedInterface, index: number) => (
        <UnsyncedItem
          key={'unsynced_' + index}
          name={_unsynced.name}
          desc={_unsynced.desc}
          id={_unsynced.id}
          created={_unsynced.created}
          type={_unsynced.type}
          onClickEdit={handleClickEdit}
          onClickRemove={handleClickRemove}
          loading={loading}
        />
      ))}
    </View>
  );
};
